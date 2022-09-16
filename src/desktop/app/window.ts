import { IpcRenderer } from "electron";
import Remote from "@electron/remote";

import { AppWindow } from "../../client/window";

export interface DesktopWindow extends AppWindow {
  ipcRenderer: IpcRenderer;
  remote: any;
}
