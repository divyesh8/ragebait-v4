// Allow TypeScript to import CSS files
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
