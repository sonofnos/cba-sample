export async function downloadElementAsPng(node: HTMLElement, filename: string) {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(node, {
    backgroundColor: "#f5f0e8",
    scale: 2,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
