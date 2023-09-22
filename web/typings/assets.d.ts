declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.woff2";
declare module "*.svg?url";
declare module "*.svg" {
  const SVGFC: React.FC<React.SVGProps<SVGSVGElement>>;

  export default SVGFC;
}
