export interface BannerResponse {
  id: string;
  titulo: string;
  subtitulo?: string;
  urlImagen: string;
  urlImagenMobile?: string;
  urlDestino?: string;
  orden: number;
  activo: boolean;
  canvasJson?: string;
}

export interface CreateBannerRequest {
  titulo: string;
  subtitulo?: string;
  urlImagen: string;
  urlImagenMobile?: string;
  urlDestino?: string;
  orden?: number;
  canvasJson?: string;
}

export interface UpdateBannerRequest {
  titulo?: string;
  subtitulo?: string;
  urlImagen?: string;
  urlImagenMobile?: string;
  urlDestino?: string;
  orden?: number;
  activo?: boolean;
  canvasJson?: string;
}
