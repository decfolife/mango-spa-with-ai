declare module 'document-viewer-sdk' {
  import * as React from 'react';

  export type DocumentSource =
    | string
    | ArrayBuffer
    | Uint8Array
    | File
    | {
        url: string;
        httpHeaders?: Record<string, string>;
      };

  export interface ToolbarConfig {
    navigation?: boolean;
    zoom?: boolean;
    zoomOut?: boolean;
    zoomSelect?: boolean;
    zoomIn?: boolean;
    rotate?: boolean;
    download?: boolean;
    print?: boolean;
    search?: boolean;
    highlight?: boolean;
    filename?: boolean;
    rightSlot?: React.ReactNode;
  }

  export interface DocumentViewerProps {
    src: DocumentSource;
    filename?: string;
    toolbar?: boolean | ToolbarConfig;
    darkMode?: boolean;
    className?: string;
    style?: React.CSSProperties;
    searchQuery?: string;
    onLoad?: (...args: any[]) => void;
    onError?: (...args: any[]) => void;
  }

  export const DocumentViewer: React.ComponentType<DocumentViewerProps>;
}

declare module 'document-vieweer-sdk' {
  export * from 'document-viewer-sdk';
}
