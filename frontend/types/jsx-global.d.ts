// react-markdown v8 references the global JSX namespace which was removed
// in the react-jsx transform. Re-export it from React so the types resolve.
import type { JSX as ReactJSX } from "react";

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
    type ElementClass = ReactJSX.ElementClass;
  }
}
