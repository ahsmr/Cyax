import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const isDev = process.env.NODE_ENV === "development";
  const iconPath = isDev
    ? path.join(__dirname, "../public/logo_square_transparent.png")
    : path.join(__dirname, "../dist/logo_square_transparent.png");

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Cyax — Control Systems Simulator",
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});