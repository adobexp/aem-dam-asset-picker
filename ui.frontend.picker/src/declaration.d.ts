declare module "*.scss";

interface Window {
  AssetShare: any;
}

type SvgrComponent = React.FC<React.SVGAttributes<SVGElement>>;

declare module "*.svg" {
  const SvgReactComponent: SvgrComponent;
  export default SvgReactComponent;
}
