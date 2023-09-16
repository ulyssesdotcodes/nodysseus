import * as ha from "hyperapp"
import { nolib, nolibLib, run } from "src/nodysseus.js";

import { isRunnable } from "src/types.js";
import { ispromise, mergeLib, newLib } from "src/util.js";

export const runh = el => el.d && el.p && el.c && ha.h(el.d, el.p, el.c);

export const run_h = ({dom_type, props, children, text}, exclude_tags=[]) => {
    return dom_type === "text_value" 
        ? ha.text(text) 
        : ha.h(dom_type, props, children?.map(c => c.el ?? c).filter(c => !!c && !exclude_tags.includes(c.dom_type)).map(c => run_h(c, exclude_tags)) ?? []) 
}


export const middleware = dispatch => (ha_action, ha_payload) => {
    const is_action_array_payload = Array.isArray(ha_action) 
        && ha_action.length === 2
        && (typeof ha_action[0] === 'function' 
                || (isRunnable(ha_action[0])));

    const is_action_obj_payload = isRunnable(ha_action)
    const action = is_action_array_payload ? ha_action[0] : ha_action;
    const payload = is_action_array_payload ? ha_action[1] : is_action_obj_payload ? {event: ha_payload} : ha_payload;

    return typeof action === 'object' && isRunnable(ha_action)
        ? dispatch((state, payload) => {
            try {
                const result = action.stateonly 
                    ? hlib.data.run_runnable(action, state)
                    : hlib.data.run_runnable(action, {state, ...payload});

                return state;

                if(!result) {
                    return state;
                }

                const effects = (result.effects ?? []).filter(e => e).map(e => {
                    if(isRunnable(e)) {
                        const effect_fn = hlib.data.run_runnable(e);
                        // Object.defineProperty(effect_fn, 'name', {value: e.fn, writable: false})
                        return effect_fn;
                    }
                    return e
                });//.map(fx => ispromise(fx) ? fx.catch(e => dispatch(s => [{...s, error: e}])) : fx);

                if (ispromise(result)) {
                    // TODO: handle promises properly
                    return state;
                }

                return result.hasOwnProperty("state")
                    ? effects.length > 0 ? [result.state, ...effects] : result.state
                    : result.hasOwnProperty("action") && result.hasOwnProperty("payload") 
                    ? [result.action, result.payload]
                    : state;
            } catch(e) {
                return {...state, error: e}
            }
        }, payload)
        : dispatch(action, payload)
}

export const hlib = mergeLib(newLib({
    ha: { 
        middleware, 
        h: {
            args: ['dom_type', 'props', 'children', 'memo'], 
            fn: (dom_type, props, children, usememo) => usememo ? ha.memo(runh, {d: dom_type, p: props, c: children}) : runh({d: dom_type, p: props, c: children})}, 
        app: ha.app, 
        text: {args: ['text'], fn: ha.text}
    },
    run_runnable: (runnable, args?, options?) => run(runnable, args, options),
}), nolibLib)
