"use client";

const KEY = "iknow3d_packeta_point_v1";

export interface PacketaPoint {
  pointId: string;
  pointName: string;
  pointAddress: string;
  isoCountry: string;
}

export function getPacketaPoint(): PacketaPoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PacketaPoint;
    // Stačí mať pointId — name môže byť prázdny v niektorých variantoch API
    if (!parsed.pointId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setPacketaPoint(point: PacketaPoint): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(point));
  window.dispatchEvent(new CustomEvent("iknow3d:packeta-point-changed"));
}

export function clearPacketaPoint(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("iknow3d:packeta-point-changed"));
}
