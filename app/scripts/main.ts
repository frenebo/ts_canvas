
export function main(div: HTMLDivElement): void {
  if (!(div instanceof HTMLDivElement)) {
    throw new Error("Could not verify that div is an HTMLDivElement");
  }
}
