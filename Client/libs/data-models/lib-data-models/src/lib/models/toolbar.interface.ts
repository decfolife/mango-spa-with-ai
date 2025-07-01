export interface ToolbarModuleLink {
  moduleID: number;
  displayOrder: number;
  securityRightTypeID: number;
  moduleDisplayName: string;
  spaurl: string; 
}

export interface ModuleLink {
  moduleID: number;
  displayOrder: number;
  securityRightTypeID: number;
  moduleDisplayName: string;
  spaurl: string; 
  isActive: boolean;
}