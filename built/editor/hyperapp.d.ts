import * as ha from "hyperapp";
export declare const runh: (el: any) => ha.ElementVNode<unknown>;
export declare const run_h: ({ dom_type, props, children, text }: {
    dom_type: any;
    props: any;
    children: any;
    text: any;
}, exclude_tags?: any[]) => ha.TextVNode | ha.ElementVNode<unknown>;
export declare const middleware: (dispatch: any) => (ha_action: any, ha_payload: any) => any;
export declare const hlib: import("src/types.js").Lib;
