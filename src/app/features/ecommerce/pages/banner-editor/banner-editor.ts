import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, inject, signal, ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { Canvas, FabricImage, IText, Rect } from 'fabric';
import type { FabricObject } from 'fabric';

import { BannerService } from '../../services/banner.service';
import { UploadService } from '../../../../core/services/upload.service';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb';

interface ObjProps {
  type: 'itext' | 'rect' | 'image' | 'other';
  fill: string;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  textAlign: string;
}

const EDITOR_MODES = [
  { key: 'desktop' as const, label: 'Escritorio', width: 860, height: 300 },
  { key: 'mobile' as const, label: 'Móvil', width: 390, height: 250 },
];

const FONTS = ['Arial', 'Impact', 'Georgia', 'Verdana', 'Times New Roman', 'Courier New'];

function base64ToFile(dataUrl: string, name: string): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], name, { type: mime });
}

@Component({
  selector: 'app-banner-editor',
  standalone: true,
  imports: [RouterLink, FormsModule, MatIconModule, BreadcrumbComponent],
  templateUrl: './banner-editor.html',
})
export class BannerEditor implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasEl') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bgFileInput') private bgFileRef!: ElementRef<HTMLInputElement>;
  @ViewChild('imgFileInput') private imgFileRef!: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly bannerSvc = inject(BannerService);
  private readonly uploadSvc = inject(UploadService);

  readonly modes = EDITOR_MODES;
  readonly fonts = FONTS;

  readonly mode = signal<'desktop' | 'mobile'>('desktop');
  readonly publishing = signal(false);
  readonly uploadingBg = signal(false);
  readonly uploadingImg = signal(false);
  readonly objProps = signal<ObjProps | null>(null);
  readonly bgColor = signal('#1a1a1a');
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);
  readonly errorMsg = signal<string | null>(null);

  titulo = '';
  subtitulo = '';
  urlDestino = '';
  orden = 0;
  activo = true;

  protected bannerId: string | null = null;
  private fab!: Canvas;
  private bgImgObj: FabricImage | null = null;
  private modeState: Record<'desktop' | 'mobile', string | null> = { desktop: null, mobile: null };
  private history: string[] = [];
  private histIdx = -1;

  ngOnInit(): void {
    this.bannerId = this.route.snapshot.paramMap.get('id');
    if (this.bannerId) {
      firstValueFrom(this.bannerSvc.obtener(this.bannerId))
        .then(async (b) => {
          // Metadatos del formulario
          this.titulo = b.titulo;
          this.subtitulo = b.subtitulo ?? '';
          this.urlDestino = b.urlDestino ?? '';
          this.orden = b.orden;
          this.activo = b.activo;
          this.cdr.detectChanges(); // forzar re-render para que los campos muestren los valores

          // Restaurar canvas: JSON completo si existe, imagen como fondo si no
          if (b.canvasJson) {
            await this.fab.loadFromJSON(JSON.parse(b.canvasJson));
            this.afterLoadJson();
            this.fab.renderAll();
            this.bgColor.set((this.fab.backgroundColor as string) ?? '#1a1a1a');
          } else if (b.urlImagen) {
            await this.applyBgImage(b.urlImagen);
          }

          // El historial empieza en el estado cargado
          this.history = [JSON.stringify(this.fab.toObject(['__isBg']))];
          this.histIdx = 0;
          this.canUndo.set(false);
          this.canRedo.set(false);
        })
        .catch(() => this.errorMsg.set('No se pudo cargar el banner.'));
    }
  }

  ngAfterViewInit(): void {
    const m = EDITOR_MODES[0];
    this.fab = new Canvas(this.canvasRef.nativeElement, {
      width: m.width,
      height: m.height,
      backgroundColor: this.bgColor(),
      preserveObjectStacking: true,
    });
    this.fab.on('selection:created', () => this.syncObjProps());
    this.fab.on('selection:updated', () => this.syncObjProps());
    this.fab.on('selection:cleared', () => this.objProps.set(null));
    this.saveHistory();
  }

  ngOnDestroy(): void {
    this.fab?.dispose();
  }

  // ─── Mode ────────────────────────────────────────────────────────────────

  /** Copia el canvas desktop escalado al canvas móvil (390×250). */
  async copyDesktopToMobile(): Promise<void> {
    // Get desktop state (save current first if we're on desktop)
    if (this.mode() === 'desktop') {
      this.modeState['desktop'] = JSON.stringify(this.fab.toObject(['__isBg']));
    }
    const desktopJson = this.modeState['desktop'];
    if (!desktopJson) return;

    const dW = 860, dH = 300, mW = 390, mH = 250;
    const xRatio = mW / dW;   // 0.4535
    const yRatio = mH / dH;   // 0.8333
    const sizeScale = Math.min(xRatio, yRatio); // 0.4535 — uniform scale for objects

    const src = JSON.parse(desktopJson);

    const scaledObjects = (src.objects ?? []).map((obj: any) => {
      if (obj.__isBg) {
        // Recalculate cover-fill for the mobile canvas dimensions
        const imgW = obj.width ?? 1;
        const imgH = obj.height ?? 1;
        const bgScale = Math.max(mW / imgW, mH / imgH);
        return {
          ...obj,
          scaleX: bgScale, scaleY: bgScale,
          left: (mW - imgW * bgScale) / 2,
          top:  (mH - imgH * bgScale) / 2,
        };
      }
      return {
        ...obj,
        left:     (obj.left     ?? 0) * xRatio,
        top:      (obj.top      ?? 0) * yRatio,
        scaleX:   (obj.scaleX   ?? 1) * sizeScale,
        scaleY:   (obj.scaleY   ?? 1) * sizeScale,
        fontSize: obj.fontSize != null ? Math.round(obj.fontSize * sizeScale) : obj.fontSize,
      };
    });

    const mobileObj = { ...src, objects: scaledObjects };

    // If currently in mobile, apply immediately
    if (this.mode() === 'mobile') {
      this.fab.setDimensions({ width: mW, height: mH });
      await this.fab.loadFromJSON(mobileObj);
      this.afterLoadJson();
      this.fab.renderAll();
      this.bgColor.set((this.fab.backgroundColor as string) ?? '#1a1a1a');
      this.history = [];
      this.histIdx = -1;
      this.saveHistory();
    }
    // Always persist in modeState so switching modes keeps the copy
    this.modeState['mobile'] = JSON.stringify(mobileObj);
  }

  async switchMode(key: 'desktop' | 'mobile'): Promise<void> {
    if (this.mode() === key) return;
    this.modeState[this.mode()] = JSON.stringify(this.fab.toObject(['__isBg']));
    this.mode.set(key);
    const m = EDITOR_MODES.find(x => x.key === key)!;
    this.fab.setDimensions({ width: m.width, height: m.height });
    const saved = this.modeState[key];
    if (saved) {
      await this.fab.loadFromJSON(JSON.parse(saved));
      this.afterLoadJson();
      this.fab.renderAll();
      this.bgColor.set((this.fab.backgroundColor as string) ?? '#1a1a1a');
    } else {
      this.fab.clear();
      this.fab.backgroundColor = this.bgColor();
      this.fab.renderAll();
    }
    this.history = [];
    this.histIdx = -1;
    this.saveHistory();
  }

  // ─── History ─────────────────────────────────────────────────────────────

  private saveHistory(): void {
    if (this.histIdx < this.history.length - 1) {
      this.history.splice(this.histIdx + 1);
    }
    this.history.push(JSON.stringify(this.fab.toObject(['__isBg'])));
    if (this.history.length > 30) this.history.shift();
    else this.histIdx++;
    this.canUndo.set(this.histIdx > 0);
    this.canRedo.set(false);
  }

  async undo(): Promise<void> {
    if (this.histIdx <= 0) return;
    this.histIdx--;
    await this.fab.loadFromJSON(JSON.parse(this.history[this.histIdx]));
    this.afterLoadJson();
    this.fab.renderAll();
    this.bgColor.set((this.fab.backgroundColor as string) ?? '#1a1a1a');
    this.canUndo.set(this.histIdx > 0);
    this.canRedo.set(this.histIdx < this.history.length - 1);
  }

  async redo(): Promise<void> {
    if (this.histIdx >= this.history.length - 1) return;
    this.histIdx++;
    await this.fab.loadFromJSON(JSON.parse(this.history[this.histIdx]));
    this.afterLoadJson();
    this.fab.renderAll();
    this.bgColor.set((this.fab.backgroundColor as string) ?? '#1a1a1a');
    this.canUndo.set(this.histIdx > 0);
    this.canRedo.set(this.histIdx < this.history.length - 1);
  }

  // ─── Tools ───────────────────────────────────────────────────────────────

  addText(): void {
    const text = new IText('Escribe aquí', {
      left: 40, top: 40, fontSize: 40, fontFamily: 'Arial',
      fill: '#ffffff', fontWeight: 'bold', editable: true,
    });
    this.fab.add(text);
    this.fab.setActiveObject(text);
    this.fab.renderAll();
    this.syncObjProps();
    this.saveHistory();
  }

  addRect(): void {
    const rect = new Rect({
      left: 80, top: 80, width: 220, height: 70,
      fill: '#000000', opacity: 0.45, rx: 8, ry: 8,
    });
    this.fab.add(rect);
    this.fab.setActiveObject(rect);
    this.fab.renderAll();
    this.syncObjProps();
    this.saveHistory();
  }

  triggerBgFile(): void { this.bgFileRef.nativeElement.click(); }
  triggerImgFile(): void { this.imgFileRef.nativeElement.click(); }

  async onBgFileSelected(e: Event): Promise<void> {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingBg.set(true);
    try {
      const res = await firstValueFrom(this.uploadSvc.subirImagen(file));
      await this.applyBgImage(res.url);
      this.saveHistory();
    } catch {
      this.errorMsg.set('Error al subir la imagen de fondo.');
    } finally {
      this.uploadingBg.set(false);
      (e.target as HTMLInputElement).value = '';
    }
  }

  async onImgFileSelected(e: Event): Promise<void> {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImg.set(true);
    try {
      const res = await firstValueFrom(this.uploadSvc.subirImagen(file));
      const img = await FabricImage.fromURL(res.url, { crossOrigin: 'anonymous' });
      const maxW = this.fab.width! * 0.6;
      if (img.width! > maxW) img.scaleToWidth(maxW);
      img.set({ left: 40, top: 40 });
      this.fab.add(img);
      this.fab.setActiveObject(img);
      this.fab.renderAll();
      this.syncObjProps();
      this.saveHistory();
    } catch {
      this.errorMsg.set('Error al subir la imagen.');
    } finally {
      this.uploadingImg.set(false);
      (e.target as HTMLInputElement).value = '';
    }
  }

  private async applyBgImage(url: string): Promise<void> {
    // Try with crossOrigin first (required for canvas.toDataURL without SecurityError)
    let img: FabricImage | null = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).catch(() => null);

    // If CORS blocked the load (img.width = 0), fall back without crossOrigin so at least it displays
    if (!img?.width || !img?.height) {
      img = await FabricImage.fromURL(url).catch(() => null);
    }

    if (!img?.width || !img?.height) {
      this.errorMsg.set('No se pudo cargar la imagen de fondo.');
      return;
    }

    const cW = this.fab.width!;
    const cH = this.fab.height!;
    const w = img.width;
    const h = img.height;
    const scale = Math.max(cW / w, cH / h);

    img.set({
      scaleX: scale, scaleY: scale,
      left: (cW - w * scale) / 2,
      top: (cH - h * scale) / 2,
      originX: 'left', originY: 'top',
      selectable: true, evented: true,
    });
    (img as any).__isBg = true;

    // Remove any existing bg image object
    this._dropBgImgObj();
    this.bgImgObj = img;
    this.fab.add(img);
    this.fab.sendObjectToBack(img);
    this.fab.discardActiveObject();
    this.fab.renderAll();
  }

  removeBgImage(): void {
    this._dropBgImgObj();
    this.fab.backgroundImage = undefined; // clear legacy backgroundImage too
    this.fab.renderAll();
    this.saveHistory();
  }

  private _dropBgImgObj(): void {
    if (this.bgImgObj) {
      this.fab.remove(this.bgImgObj);
      this.bgImgObj = null;
    }
  }

  /** After any loadFromJSON: migrate legacy backgroundImage and track bgImgObj. */
  private afterLoadJson(): void {
    // Convert old-style canvas.backgroundImage to a regular selectable object
    if (this.fab.backgroundImage) {
      const bg = this.fab.backgroundImage as FabricImage;
      bg.set({ selectable: true, evented: true });
      (bg as any).__isBg = true;
      this.fab.backgroundImage = undefined;
      this.fab.add(bg);
      this.fab.sendObjectToBack(bg);
    }
    // Re-track whichever object carries the bg tag
    this.bgImgObj = (this.fab.getObjects().find(o => (o as any).__isBg) as FabricImage) ?? null;

    // Fix any bg image that was saved with broken position/scale (Infinity / NaN)
    if (this.bgImgObj) {
      const img = this.bgImgObj;
      const cW = this.fab.width!;
      const cH = this.fab.height!;
      const w = img.width ?? 0;
      const h = img.height ?? 0;
      const badScale = !isFinite(img.scaleX ?? 1) || !isFinite(img.scaleY ?? 1);
      const badPos = !isFinite(img.left ?? 0) || !isFinite(img.top ?? 0);
      if ((badScale || badPos) && w > 0 && h > 0) {
        const scale = Math.max(cW / w, cH / h);
        img.set({
          scaleX: scale, scaleY: scale,
          left: (cW - w * scale) / 2,
          top: (cH - h * scale) / 2,
        });
      }
    }
  }

  onBgColorInput(color: string): void {
    this.bgColor.set(color);
    this.fab.backgroundColor = color;
    this.fab.renderAll();
  }

  onBgColorChange(): void {
    this.saveHistory();
  }

  deleteSelected(): void {
    const obj = this.fab.getActiveObject();
    if (!obj) return;
    if (obj === this.bgImgObj) this.bgImgObj = null;
    this.fab.remove(obj);
    this.fab.discardActiveObject();
    this.fab.renderAll();
    this.objProps.set(null);
    this.saveHistory();
  }

  bringForward(): void {
    const obj = this.fab.getActiveObject();
    if (!obj) return;
    this.fab.bringObjectForward(obj);
    this.fab.renderAll();
    this.saveHistory();
  }

  sendBackward(): void {
    const obj = this.fab.getActiveObject();
    if (!obj) return;
    this.fab.sendObjectBackwards(obj);
    this.fab.renderAll();
    this.saveHistory();
  }

  // ─── Object properties ───────────────────────────────────────────────────

  private syncObjProps(): void {
    const obj = this.fab.getActiveObject() as FabricObject | undefined;
    if (!obj) { this.objProps.set(null); return; }
    const isText = obj instanceof IText;
    const isRect = obj instanceof Rect;
    const isImg = obj instanceof FabricImage;
    this.objProps.set({
      type: isText ? 'itext' : isRect ? 'rect' : isImg ? 'image' : 'other',
      fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
      opacity: Math.round(obj.opacity * 100),
      fontSize: isText ? ((obj as IText).fontSize ?? 40) : 40,
      fontFamily: isText ? ((obj as IText).fontFamily ?? 'Arial') : 'Arial',
      bold: isText ? (obj as IText).fontWeight === 'bold' : false,
      italic: isText ? (obj as IText).fontStyle === 'italic' : false,
      textAlign: isText ? ((obj as IText).textAlign ?? 'left') : 'left',
    });
  }

  onFillColorInput(color: string): void {
    this.fab.getActiveObject()?.set('fill', color);
    this.fab.renderAll();
    this.objProps.update(p => p ? { ...p, fill: color } : p);
  }

  onFillColorChange(): void { this.saveHistory(); }

  setPropOpacity(val: number): void {
    this.fab.getActiveObject()?.set('opacity', val / 100);
    this.fab.renderAll();
    this.objProps.update(p => p ? { ...p, opacity: val } : p);
    this.saveHistory();
  }

  setPropFontSize(size: number): void {
    const obj = this.fab.getActiveObject();
    if (obj instanceof IText) { obj.set('fontSize', size); this.fab.renderAll(); }
    this.objProps.update(p => p ? { ...p, fontSize: size } : p);
    this.saveHistory();
  }

  setPropFontFamily(family: string): void {
    const obj = this.fab.getActiveObject();
    if (obj instanceof IText) { obj.set('fontFamily', family); this.fab.renderAll(); }
    this.objProps.update(p => p ? { ...p, fontFamily: family } : p);
    this.saveHistory();
  }

  toggleBold(): void {
    const obj = this.fab.getActiveObject();
    if (!(obj instanceof IText)) return;
    const next = obj.fontWeight === 'bold' ? 'normal' : 'bold';
    obj.set('fontWeight', next);
    this.fab.renderAll();
    this.objProps.update(p => p ? { ...p, bold: next === 'bold' } : p);
    this.saveHistory();
  }

  toggleItalic(): void {
    const obj = this.fab.getActiveObject();
    if (!(obj instanceof IText)) return;
    const next = obj.fontStyle === 'italic' ? 'normal' : 'italic';
    obj.set('fontStyle', next);
    this.fab.renderAll();
    this.objProps.update(p => p ? { ...p, italic: next === 'italic' } : p);
    this.saveHistory();
  }

  setTextAlign(align: string): void {
    const obj = this.fab.getActiveObject();
    if (!(obj instanceof IText)) return;
    obj.set('textAlign', align);
    this.fab.renderAll();
    this.objProps.update(p => p ? { ...p, textAlign: align } : p);
    this.saveHistory();
  }

  // ─── Publish ─────────────────────────────────────────────────────────────

  async publish(): Promise<void> {
    if (!this.titulo) return;
    this.publishing.set(true);
    this.errorMsg.set(null);

    const originalMode = this.mode();

    try {
      // Persist current mode state before switching
      this.modeState[originalMode] = JSON.stringify(this.fab.toObject(['__isBg']));

      // ── Export desktop canvas (carousel image) ──
      if (originalMode !== 'desktop') {
        const m = EDITOR_MODES.find(x => x.key === 'desktop')!;
        this.fab.setDimensions({ width: m.width, height: m.height });
        const saved = this.modeState['desktop'];
        if (saved) {
          await this.fab.loadFromJSON(JSON.parse(saved));
          this.afterLoadJson();
        } else {
          this.fab.clear();
          this.fab.backgroundColor = this.bgColor();
        }
        this.fab.renderAll();
      }

      this.fab.discardActiveObject();
      this.fab.renderAll();

      const canvasJson = JSON.stringify(this.fab.toObject(['__isBg']));
      let dataUrl: string;
      try {
        dataUrl = this.fab.toDataURL({ format: 'png', multiplier: 2 });
      } catch (e) {
        const msg = (e instanceof DOMException && e.name === 'SecurityError')
          ? 'Error de permisos al exportar el canvas. Asegúrate de que el backend está corriendo y vuelve a intentarlo.'
          : 'Error al exportar el canvas.';
        await this.restoreMode(originalMode);
        this.errorMsg.set(msg);
        this.publishing.set(false);
        return;
      }
      const desktopFile = base64ToFile(dataUrl, `banner-desktop-${Date.now()}.png`);
      const { url: urlDesktop } = await firstValueFrom(this.uploadSvc.subirImagen(desktopFile));

      // ── Export mobile canvas if designed ──
      let urlMobile: string | undefined;
      if (this.modeState['mobile']) {
        const mM = EDITOR_MODES.find(x => x.key === 'mobile')!;
        this.fab.setDimensions({ width: mM.width, height: mM.height });
        await this.fab.loadFromJSON(JSON.parse(this.modeState['mobile']));
        this.afterLoadJson();
        this.fab.discardActiveObject();
        this.fab.renderAll();
        try {
          const mDataUrl = this.fab.toDataURL({ format: 'png', multiplier: 2 });
          const mobileFile = base64ToFile(mDataUrl, `banner-mobile-${Date.now()}.png`);
          const { url: uM } = await firstValueFrom(this.uploadSvc.subirImagen(mobileFile));
          urlMobile = uM;
        } catch { /* mobile export failed, skip */ }
      }

      // Restore original mode in canvas before navigating
      await this.restoreMode(originalMode);

      const payload = {
        titulo: this.titulo,
        subtitulo: this.subtitulo || undefined,
        urlImagen: urlDesktop,
        urlImagenMobile: urlMobile,
        urlDestino: this.urlDestino || undefined,
        orden: this.orden,
        activo: this.activo,
        canvasJson,
      };
      if (this.bannerId) {
        await firstValueFrom(this.bannerSvc.actualizar(this.bannerId, payload));
      } else {
        await firstValueFrom(this.bannerSvc.crear(payload));
      }
      this.router.navigate(['/ecommerce/banners']);
    } catch {
      await this.restoreMode(originalMode);
      this.errorMsg.set('Error al publicar. Verifica tu conexión e inténtalo de nuevo.');
      this.publishing.set(false);
    }
  }

  private async restoreMode(mode: 'desktop' | 'mobile'): Promise<void> {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    const m = EDITOR_MODES.find(x => x.key === mode)!;
    this.fab.setDimensions({ width: m.width, height: m.height });
    const saved = this.modeState[mode];
    if (saved) {
      await this.fab.loadFromJSON(JSON.parse(saved));
      this.afterLoadJson();
      this.fab.renderAll();
      this.bgColor.set((this.fab.backgroundColor as string) ?? '#1a1a1a');
    } else {
      this.fab.clear();
      this.fab.backgroundColor = this.bgColor();
      this.fab.renderAll();
    }
  }
}
