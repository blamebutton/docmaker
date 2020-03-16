export default interface Renderer {
  renderFile(path: string, data: Object)

  render(content: string, data: Object);
}

