export default generic;
declare namespace generic {
    let id: string;
    let nodes: {
        "@templates.simple": {
            id: string;
            out: string;
            category: string;
            edges: {
                qgbinm2: {
                    from: string;
                    to: string;
                    as: string;
                };
                "8dy573e": {
                    from: string;
                    to: string;
                    as: string;
                };
                output_val: {
                    from: string;
                    to: string;
                    as: string;
                };
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qgbinm2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                output_val: {
                    id: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
            };
        };
        "@debug.log": {
            id: string;
            description: string;
            category: string;
            out: string;
            nodes: {
                in: {
                    id: string;
                };
                value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                graph_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    args: any[];
                    ref: string;
                    value: string;
                    name: string;
                };
            };
            edges: ({
                from: string;
                to: string;
                as: string;
                type: string;
            } | {
                from: string;
                to: string;
                as: string;
                type?: undefined;
            })[];
        };
        "@math.math": {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@debug.expect": {
            id: string;
            category: string;
            ref: string;
            value: string;
        };
        "@network.fetch": {
            id: string;
            category: string;
            name: string;
            description: string;
            ref: string;
            value: string;
        };
        "@js.call": {
            id: string;
            name: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@data.stringify": {
            id: string;
            name: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@data.parse": {
            id: string;
            name: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@math.add": {
            id: string;
            ref: string;
            category: string;
            value: string;
            description: string;
        };
        "@math.mult": {
            id: string;
            ref: string;
            value: string;
            category: string;
            description: string;
        };
        "@math.divide": {
            id: string;
            ref: string;
            value: string;
            category: string;
            description: string;
        };
        "@math.negate": {
            id: string;
            ref: string;
            value: string;
            category: string;
            description: string;
        };
        "@math.and": {
            id: string;
            ref: string;
            value: string;
            category: string;
            description: string;
        };
        "@math.convertAngle": {
            id: string;
            ref: string;
            value: string;
            category: string;
            description: string;
        };
        "@math.random": {
            id: string;
            category: string;
            description: string;
            out: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                output_val: {
                    id: string;
                    value: string;
                    ref: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                "2a5n0mp": {
                    id: string;
                    name: string;
                };
                "4twtzbr": {
                    id: string;
                    value: string;
                    ref: string;
                };
                t9tt2mz: {
                    id: string;
                    name: string;
                };
            };
            edges: {
                output_val: {
                    from: string;
                    to: string;
                    as: string;
                };
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
                "2a5n0mp": {
                    from: string;
                    to: string;
                    as: string;
                };
                "4twtzbr": {
                    from: string;
                    to: string;
                    as: string;
                };
                t9tt2mz: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
        };
        "@js.typeof": {
            id: string;
            ref: string;
            category: string;
            value: string;
            description: string;
        };
        "@js.new": {
            id: string;
            ref: string;
            category: string;
            value: string;
            description: string;
        };
        "@js.addEventListeners": {
            id: string;
            ref: string;
            category: string;
            value: string;
            description: string;
        };
        "@graph.ancestors": {
            id: string;
            out: string;
            category: string;
            description: string;
            nodes: {
                in: {
                    id: string;
                };
                graph: {
                    id: string;
                    ref: string;
                    value: string;
                };
                node: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    value: string;
                    name: string;
                };
            };
            edges: ({
                from: string;
                to: string;
                as: string;
                type: string;
            } | {
                from: string;
                to: string;
                as: string;
                type?: undefined;
            })[];
        };
        "@data.append": {
            id: string;
            category: string;
            description: string;
            nodes: {
                in: {
                    id: string;
                };
                array: {
                    id: string;
                    ref: string;
                    value: string;
                };
                item: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    value: string;
                    name: string;
                };
            };
            edges: ({
                from: string;
                to: string;
                as: string;
                type: string;
            } | {
                from: string;
                to: string;
                as: string;
                type?: undefined;
            })[];
        };
        "@data.concat": {
            id: string;
            category: string;
            description: string;
            nodes: {
                array: {
                    id: string;
                    ref: string;
                    value: string;
                };
                items: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    args: string[];
                    ref: string;
                    value: string;
                    name: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@flow.default": {
            id: string;
            out: string;
            category: string;
            description: string;
            nodes: {
                value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                is_value_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                graph_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                otherwise_is: {
                    id: string;
                    ref: string;
                    value: string;
                };
                otherwise_if: {
                    id: string;
                    ref: string;
                    value: string;
                };
                otherwise_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                is_otherwise: {
                    id: string;
                    ref: string;
                    value: string;
                };
                if_otherwise: {
                    id: string;
                    ref: string;
                };
                is_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                if_value: {
                    id: string;
                    ref: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@flow.switch": {
            id: string;
            ref: string;
            value: string;
            category: string;
            description: string;
        };
        "@data.compare": {
            id: string;
            ref: string;
            value: string;
            category: string;
            description: string;
        };
        "@flow.if": {
            id: string;
            out: string;
            category: string;
            description: string;
            nodes: {
                pred: {
                    id: string;
                    ref: string;
                    value: string;
                };
                true: {
                    id: string;
                    ref: string;
                    value: string;
                };
                false: {
                    id: string;
                    ref: string;
                    value: string;
                };
                predval: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    value: string;
                    name: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@html.svg_text": {
            id: string;
            category: string;
            description: string;
            out: string;
            nodes: {
                text: {
                    id: string;
                    ref: string;
                    value: string;
                };
                props: {
                    id: string;
                    ref: string;
                    value: string;
                };
                dom_type: {
                    id: string;
                    value: string;
                };
                text_el: {
                    id: string;
                    ref: string;
                };
                children: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        return: {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@data.fold": {
            id: string;
            category: string;
            ref: string;
            value: string;
        };
        "@flow.runnable": {
            id: string;
            category: string;
            ref: string;
            value: string;
            description: string;
        };
        "@flow.graphRunnable": {
            id: string;
            category: string;
            ref: string;
            value: string;
            description: string;
        };
        "@flow.ap": {
            id: string;
            category: string;
            ref: string;
            value: string;
            description: string;
        };
        "@js.script": {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        extern: {
            id: string;
            category: string;
            description: string;
        };
        "@data.array": {
            id: string;
            name: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@js.create_fn": {
            id: string;
            ref: string;
            category: string;
            value: string;
        };
        "@data.merge_objects": {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@data.merge_objects_mutable": {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@data.get": {
            id: string;
            category: string;
            description: string;
            out: string;
            ref: string;
            value: string;
        };
        arg: {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@data.set_mutable": {
            id: string;
            description: string;
            category: string;
            ref: string;
            value: string;
            _out: string;
            _nodes: {
                id: string;
                ref: string;
                value: string;
            }[];
            _edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@data.set": {
            id: string;
            category: string;
            description: string;
            type: string;
            ref: string;
            value: string;
        };
        "@data.modify": {
            id: string;
            category: string;
            description: string;
            type: string;
            ref: string;
            value: string;
        };
        "@data.delete": {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@html.tapbutton": {
            id: string;
            category: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                qgbinm2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                label: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "9fogdzn": {
                    id: string;
                    value: string;
                    ref: string;
                };
                ehximpo: {
                    id: string;
                };
                "4stvov8": {
                    id: string;
                    ref: string;
                };
                "8ywgts7": {
                    id: string;
                    ref: string;
                };
                v089o3o: {
                    id: string;
                    value: string;
                    ref: string;
                };
                k3rjgad: {
                    id: string;
                };
                "76he898": {
                    id: string;
                    value: string;
                };
                nhmeamz: {
                    id: string;
                    ref: string;
                };
                "7mj35x5": {
                    id: string;
                };
                bim5wsv: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "4mha35d": {
                    id: string;
                    value: string;
                };
                hbo5tmq: {
                    id: string;
                    ref: string;
                };
                lgx7u5i: {
                    id: string;
                    ref: string;
                };
                g19y12v: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "9vqinsg": {
                    id: string;
                };
                i38qweq: {
                    id: string;
                    value: string;
                };
                eemfhib: {
                    id: string;
                    value: string;
                    ref: string;
                };
                n2a984s_arr: {
                    id: string;
                    ref: string;
                };
                n2a984s: {
                    id: string;
                    ref: string;
                };
                a14g4yc: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
        };
        "@memory.graphchangecache": {
            category: string;
            edges: {
                ap_cache_value: {
                    from: string;
                    to: string;
                    as: string;
                };
                ap_cache_args: {
                    from: string;
                    to: string;
                    as: string;
                };
                ap_cache_fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                pred_cachevalue_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache: {
                    from: string;
                    to: string;
                    as: string;
                };
                cachevalue_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                cache: {
                    from: string;
                    to: string;
                    as: string;
                };
                pred_cache_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                if_cache_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                cache_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                cache_return_args: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_fn_value: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_fn_args: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_ap: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button: {
                    from: string;
                    to: string;
                    as: string;
                };
                fy9ee3e: {
                    from: string;
                    to: string;
                    as: string;
                };
                h56r87n: {
                    from: string;
                    to: string;
                    as: string;
                };
                xbhq0f0: {
                    from: string;
                    to: string;
                    as: string;
                };
                kqnga6d: {
                    from: string;
                    to: string;
                    as: string;
                };
                "9w2cqoc": {
                    from: string;
                    to: string;
                    as: string;
                };
                "2nhroiv": {
                    from: string;
                    to: string;
                    as: string;
                };
                dtfbfdm: {
                    from: string;
                    to: string;
                    as: string;
                };
                bxacisq: {
                    from: string;
                    to: string;
                    as: string;
                };
                tebglqx: {
                    from: string;
                    to: string;
                    as: string;
                };
                g1lb9hq: {
                    from: string;
                    to: string;
                    as: string;
                };
                zan0upq: {
                    from: string;
                    to: string;
                    as: string;
                };
                jonwhso: {
                    from: string;
                    to: string;
                    as: string;
                };
                ockphl3: {
                    from: string;
                    to: string;
                    as: string;
                };
                ehb5iz5: {
                    from: string;
                    to: string;
                    as: string;
                };
                "4w9hxjv": {
                    from: string;
                    to: string;
                    as: string;
                };
                fr8wvzt: {
                    from: string;
                    to: string;
                    as: string;
                };
                affc4bs: {
                    from: string;
                    to: string;
                    as: string;
                };
                y4c3klu: {
                    from: string;
                    to: string;
                    as: string;
                };
                sc3gf99: {
                    from: string;
                    to: string;
                    as: string;
                };
                juhzde2: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            id: string;
            nodes: {
                value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                graphid: {
                    id: string;
                    ref: string;
                    value: string;
                };
                recache: {
                    id: string;
                    ref: string;
                    value: string;
                };
                cachevalue_state: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pred_cachevalue_state: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pred_cache_state: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ap_cache_value: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ap_cache_args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ap_cache_fn: {
                    id: string;
                    value: string;
                    ref: string;
                };
                cache: {
                    id: string;
                    ref: string;
                };
                if_cache_state: {
                    id: string;
                    ref: string;
                };
                cache_state: {
                    id: string;
                    ref: string;
                };
                cache_return_args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                recache_button_fn: {
                    id: string;
                    value: string;
                    ref: string;
                };
                recache_button_fn_args: {
                    id: string;
                };
                recache_button_fn_value: {
                    id: string;
                };
                recache_button_ap: {
                    id: string;
                    ref: string;
                };
                recache_button: {
                    id: string;
                    value: string;
                    ref: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                fy9ee3e: {
                    id: string;
                    ref: string;
                    value: string;
                };
                h56r87n: {
                    id: string;
                    value: string;
                    ref: string;
                };
                xbhq0f0: {
                    id: string;
                    value: string;
                };
                kqnga6d: {
                    id: string;
                    ref: string;
                };
                "9w2cqoc": {
                    id: string;
                    value: string;
                    ref: string;
                };
                jmvzfm1: {
                    id: string;
                };
                "99ld3d7": {
                    id: string;
                };
                tebglqx: {
                    id: string;
                    ref: string;
                };
                "2nhroiv": {
                    id: string;
                };
                dtfbfdm: {
                    id: string;
                };
                bxacisq: {
                    id: string;
                    value: string;
                    ref: string;
                };
                zan0upq: {
                    id: string;
                    value: string;
                    ref: string;
                };
                jonwhso: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ockphl3: {
                    id: string;
                    ref: string;
                };
                ehb5iz5: {
                    id: string;
                    ref: string;
                };
                "4w9hxjv": {
                    id: string;
                    value: string;
                    ref: string;
                };
                fr8wvzt: {
                    id: string;
                    value: string;
                };
                affc4bs: {
                    id: string;
                };
                y4c3klu: {
                    id: string;
                };
                sc3gf99: {
                    id: string;
                };
                juhzde2: {
                    id: string;
                };
                g7fudn7: {
                    id: string;
                };
                z5jrs71: {
                    id: string;
                };
                crkuagp: {
                    id: string;
                };
                g1lb9hq: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            out: string;
        };
        "@memory.cache": {
            id: string;
            out: string;
            nodes: {
                value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                graphid: {
                    id: string;
                    ref: string;
                    value: string;
                };
                recache: {
                    id: string;
                    ref: string;
                    value: string;
                };
                cachevalue_state: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pred_cachevalue_state: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pred_cachevalue: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pred_cache_state: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ap_cache_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ap_cache_args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ap_cache_run: {
                    id: string;
                    value: string;
                };
                ap_cache_fn: {
                    id: string;
                    value: string;
                    ref: string;
                };
                cache: {
                    id: string;
                    ref: string;
                };
                if_cache_state: {
                    id: string;
                    ref: string;
                };
                cache_state: {
                    id: string;
                    ref: string;
                };
                cache_return_args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                recache_button_fn: {
                    id: string;
                    value: string;
                    ref: string;
                };
                recache_button_fn_args: {
                    id: string;
                };
                recache_button_fn_value: {
                    id: string;
                    value: string;
                };
                recache_button_ap: {
                    id: string;
                    ref: string;
                };
                recache_button: {
                    id: string;
                    value: string;
                    ref: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                jb9ua5s: {
                    id: string;
                    ref: string;
                };
            };
            edges: {
                ap_cache_value: {
                    from: string;
                    to: string;
                    as: string;
                };
                ap_cache_args: {
                    from: string;
                    to: string;
                    as: string;
                };
                ap_cache_run: {
                    from: string;
                    to: string;
                    as: string;
                };
                ap_cache_fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                pred_cachevalue_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache: {
                    from: string;
                    to: string;
                    as: string;
                };
                cachevalue_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                cache: {
                    from: string;
                    to: string;
                    as: string;
                };
                pred_cachevalue: {
                    from: string;
                    to: string;
                    as: string;
                };
                pred_cache_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                if_cache_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                cache_state: {
                    from: string;
                    to: string;
                    as: string;
                };
                cache_return_args: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_fn_value: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_fn_args: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button_ap: {
                    from: string;
                    to: string;
                    as: string;
                };
                recache_button: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            category: string;
        };
        "@data.isunchanged": {
            id: string;
            nodes: {
                in: {
                    id: string;
                };
                eq_fn_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                eq_fn_if: {
                    id: string;
                    ref: string;
                    value: string;
                };
                fn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                cached: {
                    id: string;
                    ref: string;
                    value: string;
                    type: string;
                };
                eq_default: {
                    id: string;
                    ref: string;
                };
                eq_runnable: {
                    id: string;
                    ref: string;
                };
                fn_runnable: {
                    id: string;
                    ref: string;
                };
                eq_fn_runnable: {
                    id: string;
                    ref: string;
                    value: string;
                };
                eq_fn: {
                    id: string;
                    ref: string;
                };
                eq_fn_return_args: {
                    id: string;
                };
                if_eq_fn: {
                    id: string;
                    ref: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                yp2q57b: {
                    id: string;
                };
                tpe5t4z: {
                    id: string;
                    ref: string;
                };
                cy1tm8s: {
                    id: string;
                    value: string;
                    ref: string;
                };
                khdzxds: {
                    id: string;
                    value: string;
                    ref: string;
                };
                lv2gcpk: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                eq_default: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_runnable: {
                    from: string;
                    to: string;
                    as: string;
                };
                fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                fn_runnable: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn_value: {
                    from: string;
                    to: string;
                    as: string;
                };
                cached: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn_runnable: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn_if: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                yp2q57b: {
                    from: string;
                    to: string;
                    as: string;
                };
                tpe5t4z: {
                    from: string;
                    to: string;
                    as: string;
                };
                cy1tm8s: {
                    from: string;
                    to: string;
                    as: string;
                };
                khdzxds: {
                    from: string;
                    to: string;
                    as: string;
                };
                lv2gcpk: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            category: string;
        };
        "@memory.refval": {
            id: string;
            ref: string;
            value: string;
            category: string;
        };
        "@memory.state": {
            id: string;
            name: string;
            out: string;
            category: string;
            ref: string;
            value: string;
        };
        "@memory.unwrap": {
            id: string;
            ref: string;
            value: string;
        };
        "@event.publish_event": {
            id: string;
            out: string;
            nodes: {
                output_val: {
                    id: string;
                    ref: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                i5m8bp1: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "3pnfu3c": {
                    id: string;
                    ref: string;
                };
                smopce2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                mz8rw6m: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "6sffwk9": {
                    id: string;
                    value: string;
                    ref: string;
                };
                xiqo1q0: {
                    id: string;
                    ref: string;
                    value: string;
                };
                k36to2l: {
                    id: string;
                };
            };
            edges: {
                output_val: {
                    from: string;
                    to: string;
                    as: string;
                };
                i5m8bp1: {
                    from: string;
                    to: string;
                    as: string;
                };
                "3pnfu3c": {
                    from: string;
                    to: string;
                    as: string;
                };
                smopce2: {
                    from: string;
                    to: string;
                    as: string;
                };
                mz8rw6m: {
                    from: string;
                    to: string;
                    as: string;
                };
                "6sffwk9": {
                    from: string;
                    to: string;
                    as: string;
                };
                xiqo1q0: {
                    from: string;
                    to: string;
                    as: string;
                };
                k36to2l: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
        };
        "@event.event_publisher_onchange": {
            id: string;
            category: string;
            description: string;
            out: string;
            nodes: {
                value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                value_out: {
                    id: string;
                    ref: string;
                    value: string;
                };
                value_eq_a: {
                    id: string;
                    ref: string;
                    value: string;
                };
                value_eq_b: {
                    id: string;
                    ref: string;
                    value: string;
                };
                value_eq_fn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                value_eq: {
                    id: string;
                    ref: string;
                };
                value_unchanged: {
                    id: string;
                    ref: string;
                };
                publisher: {
                    id: string;
                    ref: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@debug.input_value": {
            edges: {
                "1c4vbjw": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1ovmmn3": {
                    as: string;
                    from: string;
                    to: string;
                };
                "3jphobh": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4d8qcss": {
                    as: string;
                    from: string;
                    to: string;
                };
                "5a6pljw": {
                    as: string;
                    from: string;
                    to: string;
                };
                "73asljg": {
                    as: string;
                    from: string;
                    to: string;
                };
                a8nnxeo: {
                    as: string;
                    from: string;
                    to: string;
                };
                bi1dbsb: {
                    as: string;
                    from: string;
                    to: string;
                };
                dqau7vz: {
                    as: string;
                    from: string;
                    to: string;
                };
                h8q885n: {
                    as: string;
                    from: string;
                    to: string;
                };
                hm2lkjh: {
                    as: string;
                    from: string;
                    to: string;
                };
                n028q0n: {
                    as: string;
                    from: string;
                    to: string;
                };
                psog7hu: {
                    as: string;
                    from: string;
                    to: string;
                };
                rg59xbc: {
                    as: string;
                    from: string;
                    to: string;
                };
                s7kudco: {
                    as: string;
                    from: string;
                    to: string;
                };
                ut9zq8n: {
                    as: string;
                    from: string;
                    to: string;
                };
                wo0j48j: {
                    as: string;
                    from: string;
                    to: string;
                };
                xm523y9: {
                    as: string;
                    from: string;
                    to: string;
                };
                xzbcdnj: {
                    as: string;
                    from: string;
                    to: string;
                };
                zfl3aqg: {
                    as: string;
                    from: string;
                    to: string;
                };
                "9ukj84k": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1znvqbi": {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            nodes: {
                "1c4vbjw": {
                    id: string;
                    ref: string;
                };
                "1ovmmn3": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1znvqbi": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "3jphobh": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "4d8qcss": {
                    id: string;
                    ref: string;
                };
                "5a6pljw": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "73asljg": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "9ukj84k": {
                    id: string;
                    ref: string;
                };
                a8nnxeo: {
                    id: string;
                    value: string;
                };
                bi1dbsb: {
                    id: string;
                    ref: string;
                    value: string;
                };
                dqau7vz: {
                    id: string;
                    ref: string;
                    value: string;
                };
                h8q885n: {
                    id: string;
                    value: string;
                };
                hm2lkjh: {
                    id: string;
                };
                n028q0n: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                psog7hu: {
                    id: string;
                    ref: string;
                    value: string;
                };
                rg59xbc: {
                    id: string;
                    value: string;
                };
                s7kudco: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ut9zq8n: {
                    id: string;
                    ref: string;
                };
                wo0j48j: {
                    id: string;
                };
                xm523y9: {
                    id: string;
                    ref: string;
                    value: string;
                };
                xzbcdnj: {
                    id: string;
                    ref: string;
                    value: string;
                };
                zfl3aqg: {
                    id: string;
                    ref: string;
                };
            };
            out: string;
        };
        "@data.reduce": {
            id: string;
            category: string;
            description: string;
            name: string;
            in: string;
            out: string;
            nodes: {
                tgurdpo: {
                    id: string;
                    ref: string;
                    name: string;
                };
                key: {
                    id: string;
                    ref: string;
                    value: string;
                };
                rielyq8: {
                    id: string;
                    value: string;
                    name: string;
                };
                "1rre4bx": {
                    ref: string;
                    id: string;
                    value: string;
                    name: string;
                };
                "6g75abk": {
                    ref: string;
                    id: string;
                    value: string;
                    name: string;
                };
                w0zzawl: {
                    id: string;
                    ref: string;
                    name: string;
                };
                args: {
                    id: string;
                    ref: string;
                    value: string;
                    type: string;
                };
                initial: {
                    id: string;
                    ref: string;
                    value: string;
                };
                pdljod1: {
                    id: string;
                    name: string;
                    ref: string;
                    value: string;
                };
                "2lvs5dj": {
                    id: string;
                    ref: string;
                    value: string;
                    name: string;
                };
            };
            edges: ({
                from: string;
                to: string;
                as: string;
                type?: undefined;
            } | {
                from: string;
                to: string;
                as: string;
                type: string;
            })[];
        };
        "@data.map": {
            id: string;
            out: string;
            category: string;
            ref: string;
            value: string;
            description: string;
        };
        "@data.filter": {
            id: string;
            category: string;
            description: string;
            out: string;
            nodes: {
                object: {
                    id: string;
                    ref: string;
                    value: string;
                };
                pred_fn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                el_currentValue: {
                    id: string;
                    ref: string;
                    value: string;
                };
                pred_fn_args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                run_pred: {
                    id: string;
                    value: string;
                };
                pred_element_fn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                currentValue: {
                    id: string;
                    ref: string;
                    value: string;
                };
                previousValue: {
                    id: string;
                    ref: string;
                    value: string;
                };
                pred_append: {
                    id: string;
                    ref: string;
                    value: string;
                };
                pred_append_fn_args: {
                    id: string;
                    value: string;
                };
                pred_append_fn: {
                    id: string;
                    ref: string;
                };
                initial: {
                    id: string;
                    value: string;
                };
                fold: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@nodysseus.import_json": {
            id: string;
            description: string;
            name: string;
            category: string;
            out: string;
            nodes: {
                lapeojg: {
                    id: string;
                    ref: string;
                    value: string;
                    name: string;
                };
                graphid: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                "05eag47": {
                    id: string;
                    ref: string;
                    value: string;
                };
                irr99xz: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@data.object_entries": {
            id: string;
            category: string;
            description: string;
            name: string;
            in: string;
            out: string;
            nodes: {
                j8c79uf: {
                    name: string;
                    id: string;
                    ref: string;
                };
                hfexsuu: {
                    id: string;
                    ref: string;
                    value: string;
                };
                runnable_args: {
                    id: string;
                    value: string;
                };
                runnable: {
                    id: string;
                    ref: string;
                };
                bgi2g37: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "7gqcw0o": {
                    id: string;
                    ref: string;
                    value: string;
                };
                kpakw50: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@html.css_styles": {
            id: string;
            category: string;
            description: string;
            name: string;
            in: string;
            out: string;
            nodes: {
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                "5yxmxua": {
                    id: string;
                    ref: string;
                    name: string;
                };
                vgv61zj: {
                    id: string;
                    ref: string;
                };
                jstjx7g: {
                    id: string;
                    ref: string;
                    value: string;
                };
                h40e3j9: {
                    id: string;
                    value: string;
                };
                xw3pmx7: {
                    id: string;
                    name: string;
                };
                jlgp7uy: {
                    id: string;
                    ref: string;
                    name: string;
                };
                o1j78dd: {
                    id: string;
                    value: string;
                };
                ij4z84e: {
                    id: string;
                    ref: string;
                };
                q3pwj9j: {
                    id: string;
                    value: string;
                };
                d6h3gdw: {
                    id: string;
                    ref: string;
                };
                j8c79uf: {
                    id: string;
                    name: string;
                    ref: string;
                };
                n9g4wyq: {
                    id: string;
                    ref: string;
                };
                z63iaay: {
                    id: string;
                    ref: string;
                    value: string;
                };
                vwsgweb: {
                    id: string;
                    ref: string;
                };
                aelf1a7: {
                    id: string;
                    ref: string;
                    value: string;
                    name: string;
                };
                mkwx4yx: {
                    id: string;
                };
                fzr4mkv: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "5eqf77t": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5pwetw5": {
                    id: string;
                    ref: string;
                };
                o5ojdyc: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1hpnid4": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/jlgp7uy": {
                    id: string;
                    ref: string;
                    name: string;
                };
                ft1oksl: {
                    id: string;
                    ref: string;
                    value: string;
                };
                bbbp82v: {
                    id: string;
                    ref: string;
                };
                cp66ig5: {
                    id: string;
                    value: string;
                };
                uwq9u81: {
                    id: string;
                    ref: string;
                };
                "slj7ynn/ij4z84e": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/q3pwj9j": {
                    id: string;
                    value: string;
                };
                "slj7ynn/d6h3gdw": {
                    id: string;
                    ref: string;
                };
                i1ifamx: {
                    id: string;
                    ref: string;
                };
                druspar_args: {
                    id: string;
                    value: string;
                };
                n9g4wyq_args: {
                    id: string;
                    value: string;
                };
                "slj7ynn/n9g4wyq_args": {
                    id: string;
                    value: string;
                };
                "slj7ynn/druspar_args": {
                    id: string;
                    value: string;
                };
                druspar: {
                    id: string;
                    ref: string;
                };
                gth1wc2: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "slj7ynn/j8c79uf": {
                    id: string;
                    name: string;
                    ref: string;
                };
                "slj7ynn/n9g4wyq": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/z63iaay": {
                    id: string;
                    ref: string;
                    value: string;
                };
                y25dg2n: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "0d4yh8u": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "slj7ynn/vwsgweb": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/aelf1a7": {
                    id: string;
                    ref: string;
                    value: string;
                    name: string;
                };
                h13a9fd: {
                    id: string;
                    ref: string;
                    value: string;
                };
                h7me3v8: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "slj7ynn/mkwx4yx": {
                    id: string;
                };
                "slj7ynn/fzr4mkv": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "slj7ynn/5eqf77t": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "slj7ynn/1hpnid4": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/bbbp82v": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/cp66ig5": {
                    id: string;
                    value: string;
                };
                "slj7ynn/uwq9u81": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/i1ifamx": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/druspar": {
                    id: string;
                    ref: string;
                };
                "slj7ynn/gth1wc2": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "slj7ynn/y25dg2n": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "slj7ynn/0d4yh8u": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "slj7ynn/h13a9fd": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "slj7ynn/h7me3v8": {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@html.css_anim": {
            id: string;
            category: string;
            description: string;
            name: string;
            in: string;
            out: string;
            nodes: {
                spy9h48: {
                    name: string;
                    id: string;
                    ref: string;
                    value: string;
                };
                cawqofn: {
                    id: string;
                    ref: string;
                    name: string;
                };
            };
            edges: {
                as: string;
                from: string;
                to: string;
                type: string;
            }[];
        };
        "@html.input": {
            category: string;
            edges: ({
                from: string;
                to: string;
                as: string;
                type?: undefined;
            } | {
                to: string;
                from: string;
                as: string;
                type: string;
            })[];
            nodes: {
                nn4twx9: {
                    id: string;
                    ref: string;
                    inputs: {
                        from: string;
                        to: string;
                        as: string;
                    }[];
                    name: string;
                };
                gvkhkfw: {
                    id: string;
                    ref: string;
                };
                "7rhq0q5": {
                    id: string;
                    name: string;
                };
                "1ldhfah": {
                    id: string;
                    ref: string;
                    name: string;
                };
                "4972gx3": {
                    id: string;
                    ref: string;
                };
                wet0jdv: {
                    id: string;
                    ref: string;
                };
                gcuxiw9: {
                    id: string;
                };
                "875c1wk": {
                    id: string;
                    value: string;
                };
                ee5i5r2: {
                    id: string;
                    value: string;
                };
                ro8n2gc: {
                    id: string;
                    ref: string;
                };
                n1qcxu2: {
                    id: string;
                    value: string;
                };
                utkc9o6: {
                    id: string;
                    ref: string;
                };
                jxl9r29: {
                    id: string;
                    ref: string;
                    value: string;
                };
                t6q6rvf: {
                    id: string;
                };
                rjwtb3c: {
                    id: string;
                    ref: string;
                };
                varubwp: {
                    id: string;
                };
                trd8ptp: {
                    id: string;
                    ref: string;
                    value: string;
                };
                zfrrk0z: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "2zxw9oo": {
                    id: string;
                    ref: string;
                    name: string;
                };
                sjw3rie: {
                    id: string;
                    ref: string;
                };
                vks4vul: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ddfgy2s: {
                    id: string;
                };
                "671rzr9": {
                    id: string;
                    ref: string;
                    value: string;
                };
                ccir2fl: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qseh2tb: {
                    id: string;
                    ref: string;
                };
                i7y9dyy: {
                    id: string;
                    ref: string;
                };
                fihihz0: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1wps21n": {
                    id: string;
                    name: string;
                    out: string;
                    nodes: ({
                        id: string;
                        ref: string;
                        name: string;
                        value?: undefined;
                    } | {
                        id: string;
                        ref: string;
                        name?: undefined;
                        value?: undefined;
                    } | {
                        id: string;
                        ref: string;
                        value: string;
                        name?: undefined;
                    })[];
                    edges: ({
                        from: string;
                        to: string;
                        as: string;
                        type?: undefined;
                    } | {
                        from: string;
                        to: string;
                        as: string;
                        type: string;
                    })[];
                };
                y5q7mbn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                y9bkhqc: {
                    id: string;
                };
                "6m6m1hq_1/ocuonub/qjc0zt6": {
                    id: string;
                    ref: string;
                };
                nb2sswc: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "6m6m1hq_1/ocuonub/506ntvb": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "6m6m1hq_1/ocuonub/4ck1vaf": {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
            in: string;
            name: string;
            id: string;
        };
        "@html.html_text": {
            id: string;
            category: string;
            description: string;
            out: string;
            nodes: {
                arg_text: {
                    id: string;
                    ref: string;
                    value: string;
                };
                value_text: {
                    id: string;
                    ref: string;
                    value: string;
                };
                text: {
                    id: string;
                    ref: string;
                };
                text_value: {
                    id: string;
                    value: string;
                };
                out: {
                    id: string;
                    name: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@html.html_element": {
            category: string;
            description: string;
            edges: {
                out: {
                    as: string;
                    from: string;
                    to: string;
                };
                qd8ol17: {
                    as: string;
                    from: string;
                    to: string;
                };
                j9f9fql: {
                    as: string;
                    from: string;
                    to: string;
                };
                p7ed8ee: {
                    as: string;
                    from: string;
                    to: string;
                };
                lzx5shl: {
                    as: string;
                    from: string;
                    to: string;
                };
                nw9ms96: {
                    as: string;
                    from: string;
                    to: string;
                };
                xtrwqpd: {
                    as: string;
                    from: string;
                    to: string;
                };
                "4uumh6e": {
                    as: string;
                    from: string;
                    to: string;
                };
                hpjscg9: {
                    as: string;
                    from: string;
                    to: string;
                };
                k81xrr8: {
                    as: string;
                    from: string;
                    to: string;
                };
                hksj4z5: {
                    as: string;
                    from: string;
                    to: string;
                };
                sz6itfq: {
                    as: string;
                    from: string;
                    to: string;
                };
                dom_type_def: {
                    as: string;
                    from: string;
                    to: string;
                };
                fill_props: {
                    as: string;
                    from: string;
                    to: string;
                };
                filter_children: {
                    as: string;
                    from: string;
                    to: string;
                };
                memo: {
                    as: string;
                    from: string;
                    to: string;
                };
                value: {
                    as: string;
                    from: string;
                    to: string;
                };
                fill_children: {
                    as: string;
                    from: string;
                    to: string;
                };
                filter_children_fn_runnable: {
                    as: string;
                    from: string;
                    to: string;
                };
                filter_children_fn: {
                    as: string;
                    from: string;
                    to: string;
                };
                filter_children_fn_runnable_args: {
                    as: string;
                    from: string;
                    to: string;
                };
                element_dt: {
                    as: string;
                    from: string;
                    to: string;
                };
                element_tv: {
                    as: string;
                    from: string;
                    to: string;
                };
                fill_children_fn_runnable: {
                    as: string;
                    from: string;
                    to: string;
                };
                wrapped_children: {
                    as: string;
                    from: string;
                    to: string;
                };
                children: {
                    as: string;
                    from: string;
                    to: string;
                };
                fill_children_fn: {
                    as: string;
                    from: string;
                    to: string;
                };
                fill_children_fn_runnable_args: {
                    as: string;
                    from: string;
                    to: string;
                };
                element: {
                    as: string;
                    from: string;
                    to: string;
                };
                props: {
                    as: string;
                    from: string;
                    to: string;
                };
                dom_type: {
                    as: string;
                    from: string;
                    to: string;
                };
                dom_type_value: {
                    as: string;
                    from: string;
                    to: string;
                };
                div: {
                    as: string;
                    from: string;
                    to: string;
                };
                graph_value: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            nodes: {
                out_ret: {
                    id: string;
                    name: string;
                    ref: string;
                };
                qd8ol17: {
                    id: string;
                };
                p7ed8ee: {
                    id: string;
                    ref: string;
                    value: string;
                };
                j9f9fql: {
                    id: string;
                };
                nw9ms96: {
                    id: string;
                    value: string;
                };
                lzx5shl: {
                    id: string;
                    ref: string;
                };
                xtrwqpd: {
                    id: string;
                };
                "4uumh6e": {
                    id: string;
                    ref: string;
                    value: string;
                };
                k81xrr8: {
                    id: string;
                    ref: string;
                };
                sz6itfq: {
                    id: string;
                    ref: string;
                    value: string;
                };
                hksj4z5: {
                    id: string;
                    ref: string;
                    value: string;
                };
                hpjscg9: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    value: string;
                };
                value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                memo: {
                    id: string;
                    ref: string;
                    value: string;
                };
                filter_children: {
                    id: string;
                    ref: string;
                };
                filter_children_fn_runnable: {
                    id: string;
                    ref: string;
                };
                filter_children_fn_runnable_args: {
                    id: string;
                    value: string;
                };
                filter_children_fn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                element_tv: {
                    id: string;
                    ref: string;
                    value: string;
                };
                element_dt: {
                    id: string;
                    ref: string;
                    value: string;
                };
                fill_children: {
                    id: string;
                    ref: string;
                };
                wrapped_children: {
                    id: string;
                    ref: string;
                    value: string;
                };
                children: {
                    id: string;
                    ref: string;
                    value: string;
                };
                fill_children_fn_runnable: {
                    id: string;
                    ref: string;
                };
                fill_children_fn_runnable_args: {
                    id: string;
                    value: string;
                };
                fill_children_fn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                element: {
                    id: string;
                    ref: string;
                    value: string;
                };
                fill_props: {
                    id: string;
                    ref: string;
                    value: string;
                };
                props: {
                    id: string;
                    ref: string;
                    value: string;
                };
                dom_type_def: {
                    id: string;
                    ref: string;
                };
                dom_type_value: {
                    id: string;
                    ref: string;
                };
                graph_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                div: {
                    id: string;
                    value: string;
                };
                dom_type: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
        };
        "@html.icon": {
            id: string;
            description: string;
            category: string;
            name: string;
            out: string;
            nodes: {
                c2sko9c: {
                    id: string;
                    ref: string;
                    name: string;
                };
                "2lr3ihi": {
                    id: string;
                    value: string;
                };
                empty_obj: {
                    id: string;
                    value: {};
                };
                props: {
                    id: string;
                    ref: string;
                    value: string;
                };
                props_pred: {
                    id: string;
                    ref: string;
                    value: string;
                };
                iconclass: {
                    id: string;
                    value: string;
                };
                defined_props: {
                    id: string;
                    ref: string;
                };
                name_path: {
                    id: string;
                    value: string;
                };
                a0jb5es: {
                    id: string;
                    ref: string;
                    value: string;
                };
                s5x2r1f: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
        };
        "@data.not": {
            id: string;
            ref: string;
            category: string;
            value: string;
        };
        "@html.canvas_behind_editor": {
            id: string;
            out: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "5a6pljw": {
                    id: string;
                    ref: string;
                };
                h2e7s9l: {
                    id: string;
                    value: string;
                };
                imr2dvi: {
                    id: string;
                    ref: string;
                };
                "09epq8r": {
                    id: string;
                    ref: string;
                };
                af9fknz: {
                    id: string;
                    value: string;
                    ref: string;
                };
                cilv4od: {
                    id: string;
                };
                zvop9wi: {
                    id: string;
                    value: string;
                    ref: string;
                };
                zvop9wi_2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                qe7qvud: {
                    id: string;
                    ref: string;
                };
                "45uuwjl": {
                    id: string;
                };
                ejd0zjg: {
                    id: string;
                };
                "50811j9": {
                    id: string;
                    ref: string;
                };
                vmabx98: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ah2tu3m: {
                    id: string;
                    value: string;
                    ref: string;
                };
                cxwaij4: {
                    id: string;
                };
                "8cq1yfs": {
                    id: string;
                    value: string;
                    ref: string;
                };
                q96l549: {
                    id: string;
                    value: string;
                    ref: string;
                };
                icdi8jh: {
                    id: string;
                    value: string;
                };
                b6e9ux3: {
                    id: string;
                    value: string;
                };
                zq4ni3x: {
                    id: string;
                };
                uzulnsq: {
                    id: string;
                    value: string;
                };
                aoi9bi9: {
                    id: string;
                    value: string;
                };
                "3ucsio2": {
                    id: string;
                    ref: string;
                    value: string;
                };
                jzduiha: {
                    id: string;
                    value: string;
                };
                kup95dw: {
                    id: string;
                    value: string;
                };
                "75jvde6": {
                    id: string;
                    value: string;
                    name: string;
                };
                "0uhor53": {
                    id: string;
                    value: string;
                };
                ag93b9f: {
                    id: string;
                    value: string;
                };
                zgmfuzy: {
                    id: string;
                    value: string;
                };
                dx3qg99: {
                    id: string;
                    value: string;
                    name: string;
                };
                z54r0bl: {
                    id: string;
                };
                tok49em: {
                    id: string;
                    value: string;
                };
                tok49eq: {
                    id: string;
                    value: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                hzvlwu7: {
                    id: string;
                    ref: string;
                    value: string;
                };
                mcpndlx: {
                    id: string;
                    value: string;
                };
            };
            edges: {
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
                imr2dvi: {
                    from: string;
                    to: string;
                    as: string;
                };
                h2e7s9l: {
                    from: string;
                    to: string;
                    as: string;
                };
                "09epq8r": {
                    from: string;
                    to: string;
                    as: string;
                };
                af9fknz: {
                    from: string;
                    to: string;
                    as: string;
                };
                cilv4od: {
                    from: string;
                    to: string;
                    as: string;
                };
                zvop9wi: {
                    from: string;
                    to: string;
                    as: string;
                };
                zvop9wi_2: {
                    from: string;
                    to: string;
                    as: string;
                };
                qe7qvud: {
                    from: string;
                    to: string;
                    as: string;
                };
                "50811j9": {
                    from: string;
                    to: string;
                    as: string;
                };
                "45uuwjl": {
                    from: string;
                    to: string;
                    as: string;
                };
                vmabx98: {
                    from: string;
                    to: string;
                    as: string;
                };
                ah2tu3m: {
                    from: string;
                    to: string;
                    as: string;
                };
                cxwaij4: {
                    from: string;
                    to: string;
                    as: string;
                };
                "75jvde6": {
                    from: string;
                    to: string;
                    as: string;
                };
                "8cq1yfs": {
                    from: string;
                    to: string;
                    as: string;
                };
                q96l549: {
                    from: string;
                    to: string;
                    as: string;
                };
                icdi8jh: {
                    from: string;
                    to: string;
                    as: string;
                };
                jzduiha: {
                    from: string;
                    to: string;
                    as: string;
                };
                b6e9ux3: {
                    from: string;
                    to: string;
                    as: string;
                };
                zq4ni3x: {
                    from: string;
                    to: string;
                    as: string;
                };
                uzulnsq: {
                    from: string;
                    to: string;
                    as: string;
                };
                aoi9bi9: {
                    from: string;
                    to: string;
                    as: string;
                };
                kup95dw: {
                    from: string;
                    to: string;
                    as: string;
                };
                "3ucsio2": {
                    from: string;
                    to: string;
                    as: string;
                };
                "0uhor53": {
                    from: string;
                    to: string;
                    as: string;
                };
                ag93b9f: {
                    from: string;
                    to: string;
                    as: string;
                };
                dx3qg99: {
                    from: string;
                    to: string;
                    as: string;
                };
                zgmfuzy: {
                    from: string;
                    to: string;
                    as: string;
                };
                ejd0zjg: {
                    from: string;
                    to: string;
                    as: string;
                };
                z54r0bl: {
                    from: string;
                    to: string;
                    as: string;
                };
                tok49em: {
                    from: string;
                    to: string;
                    as: string;
                };
                tok49eq: {
                    from: string;
                    to: string;
                    as: string;
                };
                hzvlwu7: {
                    from: string;
                    to: string;
                    as: string;
                };
                mcpndlx: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            category: string;
        };
        "@js.import_module": {
            id: string;
            category: string;
            description: string;
            ref: string;
            value: string;
        };
        "@nodysseus.import": {
            category: string;
            edges: {
                "8dy573e": {
                    as: string;
                    from: string;
                    to: string;
                };
                args: {
                    as: string;
                    from: string;
                    to: string;
                };
                arcnyff: {
                    as: string;
                    from: string;
                    to: string;
                };
                qgbinm2: {
                    as: string;
                    from: string;
                    to: string;
                };
                rtrp3nj: {
                    as: string;
                    from: string;
                    to: string;
                };
                vnibm4q: {
                    as: string;
                    from: string;
                    to: string;
                };
                "07fjn2b": {
                    as: string;
                    from: string;
                    to: string;
                };
                jmqcpll: {
                    as: string;
                    from: string;
                    to: string;
                };
                rdt0k55: {
                    as: string;
                    from: string;
                    to: string;
                };
                nyua4xj: {
                    as: string;
                    from: string;
                    to: string;
                };
                ukrwz7a: {
                    as: string;
                    from: string;
                    to: string;
                };
                xr7en45: {
                    as: string;
                    from: string;
                    to: string;
                };
                j15fuyv: {
                    as: string;
                    from: string;
                    to: string;
                };
                oq98097: {
                    as: string;
                    from: string;
                    to: string;
                };
                "3depwju": {
                    as: string;
                    from: string;
                    to: string;
                };
                t2m4hm1: {
                    as: string;
                    from: string;
                    to: string;
                };
                wnzy88o: {
                    as: string;
                    from: string;
                    to: string;
                };
                "3bp1afd": {
                    as: string;
                    from: string;
                    to: string;
                };
                uymxrxe: {
                    as: string;
                    from: string;
                    to: string;
                };
                ahwepj1: {
                    as: string;
                    from: string;
                    to: string;
                };
                yu0e7mk: {
                    as: string;
                    from: string;
                    to: string;
                };
                cixrltc: {
                    as: string;
                    from: string;
                    to: string;
                };
                o58l5no: {
                    as: string;
                    from: string;
                    to: string;
                };
                n8fhfq0: {
                    as: string;
                    from: string;
                    to: string;
                };
                hcp6xds: {
                    as: string;
                    from: string;
                    to: string;
                };
                ij46kiv: {
                    as: string;
                    from: string;
                    to: string;
                };
                "3z8hhss": {
                    as: string;
                    from: string;
                    to: string;
                };
                jvoijof: {
                    as: string;
                    from: string;
                    to: string;
                };
                tjdp551: {
                    as: string;
                    from: string;
                    to: string;
                };
                s4ymsk5: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            nodes: {
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                arcnyff: {
                    id: string;
                    ref: string;
                };
                rtrp3nj: {
                    id: string;
                    ref: string;
                    value: string;
                };
                vnibm4q: {
                    id: string;
                };
                rdt0k55: {
                    id: string;
                    value: string;
                };
                jmqcpll: {
                    id: string;
                    ref: string;
                };
                ukrwz7a: {
                    id: string;
                };
                xr7en45: {
                    id: string;
                };
                nyua4xj: {
                    id: string;
                    ref: string;
                };
                oq98097: {
                    id: string;
                };
                "3depwju": {
                    id: string;
                    ref: string;
                };
                t2m4hm1: {
                    id: string;
                    ref: string;
                    value: string;
                };
                wnzy88o: {
                    id: string;
                    ref: string;
                    value: string;
                };
                j15fuyv: {
                    id: string;
                };
                uymxrxe: {
                    id: string;
                    ref: string;
                };
                yu0e7mk: {
                    id: string;
                    ref: string;
                };
                o58l5no: {
                    id: string;
                };
                n8fhfq0: {
                    id: string;
                };
                cixrltc: {
                    id: string;
                    ref: string;
                    value: string;
                };
                hcp6xds: {
                    id: string;
                    ref: string;
                };
                ij46kiv: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "3z8hhss": {
                    id: string;
                    ref: string;
                    value: string;
                };
                ahwepj1: {
                    id: string;
                    ref: string;
                };
                tjdp551: {
                    id: string;
                    ref: string;
                    value: string;
                };
                jvoijof: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "3bp1afd": {
                    id: string;
                    ref: string;
                    value: string;
                };
                s4ymsk5: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "07fjn2b": {
                    id: string;
                    value: string;
                };
                qgbinm2: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
        };
        "@nodysseus.import_nodes": {
            id: string;
            description: string;
            name: string;
            category: string;
            nodes: {
                v10aosf: {
                    id: string;
                    name: string;
                    ref: string;
                };
                uymxrxe: {
                    id: string;
                    ref: string;
                };
                mvg23pd: {
                    id: string;
                };
                jvoijof: {
                    id: string;
                    ref: string;
                };
                yu0e7mk: {
                    id: string;
                    ref: string;
                };
                ffu9m49: {
                    id: string;
                    value: string;
                    ref: string;
                };
                sl7qlmj: {
                    id: string;
                    value: string;
                    ref: string;
                };
                cixrltc: {
                    id: string;
                    value: string;
                    ref: string;
                };
                odeeqm8: {
                    id: string;
                    value: string;
                    ref: string;
                };
                hcp6xds: {
                    id: string;
                    ref: string;
                };
                ij46kiv: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "3z8hhss": {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
        };
        "@graphics.offscreenCanvas": {
            id: string;
            category: string;
            description: string;
            name: string;
            nodes: {
                "0g1zopd": {
                    id: string;
                    name: string;
                    ref: string;
                };
                ein7naf: {
                    id: string;
                    ref: string;
                };
                "9p0focj": {
                    id: string;
                };
                "98f35dl": {
                    id: string;
                    value: string;
                    ref: string;
                };
                dzb8l3m: {
                    id: string;
                    value: string;
                    ref: string;
                };
                c2vbqba: {
                    id: string;
                };
                hdn9zr5: {
                    id: string;
                    value: string;
                };
                o40rphy: {
                    id: string;
                };
                p6vd4i7: {
                    id: string;
                    value: string;
                    ref: string;
                };
                lik4fr6: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5q5ltj4": {
                    id: string;
                    value: string;
                    ref: string;
                };
                w7dugd7: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "1wirpfe": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "16rxy2o": {
                    id: string;
                    value: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
        };
        "@nodysseus.delete_ref": {
            id: string;
            name: string;
            out: string;
            category: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                jklqh38: {
                    id: string;
                    ref: string;
                };
                "6qkew20": {
                    id: string;
                    ref: string;
                };
                zihm1kd: {
                    id: string;
                };
                "3b7bnzm": {
                    id: string;
                    ref: string;
                };
                pcx97n4: {
                    id: string;
                    value: string;
                    ref: string;
                };
                rk7hcxc: {
                    id: string;
                };
                b8wohxv: {
                    id: string;
                    value: string;
                };
                x200f4j: {
                    id: string;
                    value: string;
                };
                et5g0m1: {
                    id: string;
                    ref: string;
                };
                "9tv13iq": {
                    id: string;
                    value: string;
                    ref: string;
                };
                dd6st1b: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "2yur4h7": {
                    id: string;
                    ref: string;
                };
                xdot36k: {
                    id: string;
                };
                "1edrrwq": {
                    id: string;
                    value: string;
                    ref: string;
                };
                skqnl08: {
                    id: string;
                    ref: string;
                };
                "3y8pyc2": {
                    id: string;
                    value: string;
                    ref: string;
                };
                tfwqhqf: {
                    id: string;
                    value: string;
                };
                tad7830: {
                    id: string;
                    ref: string;
                };
                jdufmth: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "898n6f7": {
                    id: string;
                    ref: string;
                };
                "9jvfgj1": {
                    id: string;
                    value: string;
                    ref: string;
                };
                j2c518b: {
                    id: string;
                };
                qpiqhgp: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "main/out": {
                    id: string;
                    name: string;
                    ref: string;
                };
                "8dy573e": {
                    id: string;
                    value: string;
                    ref: string;
                };
                n7aaoju: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ibmy4bt: {
                    id: string;
                    ref: string;
                };
                jdoak4g: {
                    id: string;
                    value: string;
                    ref: string;
                };
                a32fufq: {
                    id: string;
                    ref: string;
                };
                pfmdyvv: {
                    id: string;
                };
                "9cwkm4z": {
                    id: string;
                    value: string;
                };
                h10oho6: {
                    id: string;
                    ref: string;
                };
                "2r1dra9": {
                    id: string;
                    value: string;
                };
                semslq4: {
                    id: string;
                    value: string;
                    ref: string;
                };
                vffalrt: {
                    id: string;
                    value: string;
                    ref: string;
                };
                vqk5ztl: {
                    id: string;
                };
                ygewxjl: {
                    id: string;
                };
                i153jv4: {
                    id: string;
                    ref: string;
                };
                nxihxr3: {
                    id: string;
                    ref: string;
                };
                pdox5d1: {
                    id: string;
                    value: string;
                    ref: string;
                };
                qvl4qif: {
                    id: string;
                    value: string;
                    ref: string;
                };
                dqujder: {
                    id: string;
                };
                "7c6mxi9": {
                    id: string;
                    ref: string;
                };
                "00fj2qe": {
                    id: string;
                    value: string;
                    ref: string;
                };
                rgoguh4: {
                    id: string;
                };
                o2uz727: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
                n7aaoju: {
                    from: string;
                    to: string;
                    as: string;
                };
                jklqh38: {
                    from: string;
                    to: string;
                    as: string;
                };
                "6qkew20": {
                    from: string;
                    to: string;
                    as: string;
                };
                zihm1kd: {
                    from: string;
                    to: string;
                    as: string;
                };
                tad7830: {
                    from: string;
                    to: string;
                    as: string;
                };
                jdufmth: {
                    from: string;
                    to: string;
                    as: string;
                };
                "3b7bnzm": {
                    from: string;
                    to: string;
                    as: string;
                };
                pcx97n4: {
                    from: string;
                    to: string;
                    as: string;
                };
                rk7hcxc: {
                    from: string;
                    to: string;
                    as: string;
                };
                b8wohxv: {
                    from: string;
                    to: string;
                    as: string;
                };
                x200f4j: {
                    from: string;
                    to: string;
                    as: string;
                };
                "3y8pyc2": {
                    from: string;
                    to: string;
                    as: string;
                };
                et5g0m1: {
                    from: string;
                    to: string;
                    as: string;
                };
                "9tv13iq": {
                    from: string;
                    to: string;
                    as: string;
                };
                "2yur4h7": {
                    from: string;
                    to: string;
                    as: string;
                };
                dd6st1b: {
                    from: string;
                    to: string;
                    as: string;
                };
                xdot36k: {
                    from: string;
                    to: string;
                    as: string;
                };
                "1edrrwq": {
                    from: string;
                    to: string;
                    as: string;
                };
                skqnl08: {
                    from: string;
                    to: string;
                    as: string;
                };
                tfwqhqf: {
                    from: string;
                    to: string;
                    as: string;
                };
                "898n6f7": {
                    from: string;
                    to: string;
                    as: string;
                };
                "9jvfgj1": {
                    from: string;
                    to: string;
                    as: string;
                };
                j2c518b: {
                    from: string;
                    to: string;
                    as: string;
                };
                qpiqhgp: {
                    from: string;
                    to: string;
                    as: string;
                };
                "8dy573e": {
                    from: string;
                    to: string;
                    as: string;
                };
                ibmy4bt: {
                    from: string;
                    to: string;
                    as: string;
                };
                jdoak4g: {
                    from: string;
                    to: string;
                    as: string;
                };
                a32fufq: {
                    from: string;
                    to: string;
                    as: string;
                };
                pfmdyvv: {
                    from: string;
                    to: string;
                    as: string;
                };
                "9cwkm4z": {
                    from: string;
                    to: string;
                    as: string;
                };
                h10oho6: {
                    from: string;
                    to: string;
                    as: string;
                };
                "2r1dra9": {
                    from: string;
                    to: string;
                    as: string;
                };
                semslq4: {
                    from: string;
                    to: string;
                    as: string;
                };
                vffalrt: {
                    from: string;
                    to: string;
                    as: string;
                };
                vqk5ztl: {
                    from: string;
                    to: string;
                    as: string;
                };
                ygewxjl: {
                    from: string;
                    to: string;
                    as: string;
                };
                i153jv4: {
                    from: string;
                    to: string;
                    as: string;
                };
                nxihxr3: {
                    from: string;
                    to: string;
                    as: string;
                };
                pdox5d1: {
                    from: string;
                    to: string;
                    as: string;
                };
                qvl4qif: {
                    from: string;
                    to: string;
                    as: string;
                };
                dqujder: {
                    from: string;
                    to: string;
                    as: string;
                };
                "7c6mxi9": {
                    from: string;
                    to: string;
                    as: string;
                };
                rgoguh4: {
                    from: string;
                    to: string;
                    as: string;
                };
                o2uz727: {
                    from: string;
                    to: string;
                    as: string;
                };
                "00fj2qe": {
                    from: string;
                    to: string;
                    as: string;
                };
            };
        };
        "@data.changed": {
            id: string;
            category: string;
            description: string;
            name: string;
            nodes: {
                p8v5ed5: {
                    id: string;
                    name: string;
                    ref: string;
                };
                "14mzqe3": {
                    id: string;
                };
                vs4opfd: {
                    id: string;
                    ref: string;
                };
                "3l4ufol": {
                    id: string;
                };
                jlmvbt7: {
                    id: string;
                    value: string;
                    ref: string;
                };
                izbtl3g: {
                    id: string;
                    value: string;
                    ref: string;
                };
                mm880mz: {
                    id: string;
                    ref: string;
                };
                kw0x0bm: {
                    id: string;
                    value: string;
                    ref: string;
                };
                qqzgl4i: {
                    id: string;
                };
                f0ticbo: {
                    id: string;
                };
                fvvux6n: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "2cvrnm9": {
                    id: string;
                    value: string;
                    ref: string;
                };
                uqm4o4b: {
                    id: string;
                    value: string;
                    ref: string;
                };
                a59coum: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pt5nb1r: {
                    id: string;
                    value: string;
                    ref: string;
                };
                hkxrk6s: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
        };
        "@graphics.webgl": {
            id: string;
            category: string;
            description: string;
            nodes: {
                j219svq: {
                    id: string;
                };
                "04xuprq": {
                    id: string;
                };
                jidlrdv: {
                    id: string;
                    value: string;
                    ref: string;
                };
                gkv4bqi: {
                    id: string;
                    ref: string;
                };
                ea0tgct: {
                    id: string;
                    value: string;
                    ref: string;
                };
                rh45l5q: {
                    id: string;
                    value: string;
                    ref: string;
                };
                hzz1ww4: {
                    id: string;
                    value: string;
                    ref: string;
                };
                qjktjzv: {
                    id: string;
                    value: string;
                    ref: string;
                };
                bu3m3jq: {
                    id: string;
                    ref: string;
                };
                camgxqu: {
                    id: string;
                    ref: string;
                };
                "3j7l8wk": {
                    id: string;
                    value: string;
                    ref: string;
                };
                wrpwzyg: {
                    id: string;
                    value: string;
                    ref: string;
                };
                l41589j: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5luq4y5": {
                    id: string;
                    value: string;
                    ref: string;
                };
                esayius: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "2mgzzwp": {
                    id: string;
                    ref: string;
                };
                bkeent2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                qbj2tl2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                wyb1z00: {
                    id: string;
                    name: string;
                };
                "8njh1mx": {
                    id: string;
                    value: string;
                    ref: string;
                };
                ca17ykm: {
                    id: string;
                    value: string;
                    ref: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                ng2kjpd: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "7i0o3pn": {
                    id: string;
                    value: string;
                    ref: string;
                };
                p2ibbe3: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8dy573e/8dy573e": {
                    id: string;
                    out: string;
                    nodes: ({
                        id: string;
                        ref: string;
                        value?: undefined;
                    } | {
                        id: string;
                        ref?: undefined;
                        value?: undefined;
                    } | {
                        id: string;
                        value: string;
                        ref?: undefined;
                    })[];
                    edges: {
                        from: string;
                        to: string;
                        as: string;
                    }[];
                };
                "1lgkj23": {
                    id: string;
                    value: string;
                    ref: string;
                };
                derz1cv: {
                    id: string;
                    value: string;
                    ref: string;
                };
                duubxl9: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5pjjo2a": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "4r5fc0b": {
                    id: string;
                    value: string;
                    ref: string;
                };
                fbru2p5: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "01l4ilv": {
                    id: string;
                    value: string;
                    name: string;
                    ref: string;
                };
                tfz84l0: {
                    id: string;
                    ref: string;
                };
                "5bt6mgs": {
                    id: string;
                    ref: string;
                };
                njrst9d: {
                    id: string;
                    value: string;
                    name: string;
                    ref: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
        };
        "@graphics.load_shader": {
            id: string;
            category: string;
            description: string;
            name: string;
            nodes: {
                "37nc07d": {
                    id: string;
                };
                c0cr54c: {
                    id: string;
                    value: string;
                    name: string;
                    ref: string;
                };
                l3qddzc: {
                    id: string;
                    value: string;
                    ref: string;
                };
                e5uhxrd: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "6o4os08": {
                    id: string;
                    value: string;
                    ref: string;
                };
                bu3m3jq: {
                    id: string;
                    name: string;
                    ref: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
        };
        "@event.subscribe_many": {
            id: string;
            name: string;
            nodes: {
                ld37qq4: {
                    id: string;
                    name: string;
                    ref: string;
                };
                ndna6vl: {
                    id: string;
                };
                r0v26jn: {
                    id: string;
                    name: string;
                    ref: string;
                };
                "0n8k0b7": {
                    id: string;
                    value: string;
                    ref: string;
                };
                kd528s8: {
                    id: string;
                    name: string;
                    ref: string;
                };
                rxoook3: {
                    id: string;
                    ref: string;
                };
                daykk9b: {
                    id: string;
                };
                "6kwqo8l": {
                    id: string;
                    value: string;
                    name: string;
                    ref: string;
                };
                bzkaiyo: {
                    id: string;
                    name: string;
                    ref: string;
                };
                hsq8vrp: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5mzlv42": {
                    id: string;
                };
                pkd8b0p: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8zi1gzy": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "9716t7q": {
                    id: string;
                    name: string;
                    ref: string;
                };
                hi50l05: {
                    id: string;
                    ref: string;
                };
                opox5xi: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5szjf17": {
                    id: string;
                    value: string;
                    ref: string;
                };
                it3evdr: {
                    id: string;
                };
                qd1bvw9: {
                    id: string;
                };
                "6barb7g": {
                    id: string;
                    ref: string;
                };
                i7tgtne: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "7rpfcmk": {
                    id: string;
                    ref: string;
                };
                xk6e7zh: {
                    id: string;
                };
                pf10ku6: {
                    id: string;
                    ref: string;
                };
                km7iwa0: {
                    id: string;
                    ref: string;
                };
                zyqw0ko: {
                    id: string;
                    value: string;
                    ref: string;
                };
                f0roa3q: {
                    id: string;
                    value: string;
                    ref: string;
                };
                rat3zkt: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "2mcffa6": {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
            category: string;
        };
        "@html.slider": {
            edges: {
                "0i85qjj": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1dhoyv2": {
                    as: string;
                    from: string;
                    to: string;
                };
                "24q0egm": {
                    as: string;
                    from: string;
                    to: string;
                };
                "2wp8ffd": {
                    as: string;
                    from: string;
                    to: string;
                };
                "34k9xvb": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4dh6wzn": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4subc0j": {
                    as: string;
                    from: string;
                    to: string;
                };
                "5mog0bc": {
                    as: string;
                    from: string;
                    to: string;
                };
                "7c2vt3d": {
                    as: string;
                    from: string;
                    to: string;
                };
                "8f3izp7": {
                    as: string;
                    from: string;
                    to: string;
                };
                "93rx3ru": {
                    as: string;
                    from: string;
                    to: string;
                };
                a6rdag9: {
                    as: string;
                    from: string;
                    to: string;
                };
                av63lw9: {
                    as: string;
                    from: string;
                    to: string;
                };
                bts7694: {
                    as: string;
                    from: string;
                    to: string;
                };
                d1wcpk1: {
                    as: string;
                    from: string;
                    to: string;
                };
                d86emo2: {
                    as: string;
                    from: string;
                    to: string;
                };
                doz740g: {
                    as: string;
                    from: string;
                    to: string;
                };
                e996mm5: {
                    as: string;
                    from: string;
                    to: string;
                };
                ewycyaq: {
                    as: string;
                    from: string;
                    to: string;
                };
                ezx9hxj: {
                    as: string;
                    from: string;
                    to: string;
                };
                fd7yax9: {
                    as: string;
                    from: string;
                    to: string;
                };
                fgmcy0x: {
                    as: string;
                    from: string;
                    to: string;
                };
                gibdj45: {
                    as: string;
                    from: string;
                    to: string;
                };
                gtpf6x9: {
                    as: string;
                    from: string;
                    to: string;
                };
                gvk9hec: {
                    as: string;
                    from: string;
                    to: string;
                };
                h19qe28: {
                    as: string;
                    from: string;
                    to: string;
                };
                ku4l1v6: {
                    as: string;
                    from: string;
                    to: string;
                };
                kyu6h8m: {
                    as: string;
                    from: string;
                    to: string;
                };
                l5bzesi: {
                    as: string;
                    from: string;
                    to: string;
                };
                lptf53h: {
                    as: string;
                    from: string;
                    to: string;
                };
                mpbvtrq: {
                    as: string;
                    from: string;
                    to: string;
                };
                n4i4t17: {
                    as: string;
                    from: string;
                    to: string;
                };
                nrhhdip: {
                    as: string;
                    from: string;
                    to: string;
                };
                obkkk9p: {
                    as: string;
                    from: string;
                    to: string;
                };
                old0t0c: {
                    as: string;
                    from: string;
                    to: string;
                };
                on0cfjb: {
                    as: string;
                    from: string;
                    to: string;
                };
                oqbuspj: {
                    as: string;
                    from: string;
                    to: string;
                };
                parseval: {
                    as: string;
                    from: string;
                    to: string;
                };
                q09a315: {
                    as: string;
                    from: string;
                    to: string;
                };
                q8ugbch: {
                    as: string;
                    from: string;
                    to: string;
                };
                r0fsdrm: {
                    as: string;
                    from: string;
                    to: string;
                };
                r1ah7g2: {
                    as: string;
                    from: string;
                    to: string;
                };
                racg3p7: {
                    as: string;
                    from: string;
                    to: string;
                };
                sb9qdgy: {
                    as: string;
                    from: string;
                    to: string;
                };
                slidervalpublish: {
                    as: string;
                    from: string;
                    to: string;
                };
                sv49nso: {
                    as: string;
                    from: string;
                    to: string;
                };
                sxjhepz: {
                    as: string;
                    from: string;
                    to: string;
                };
                t1deznd: {
                    as: string;
                    from: string;
                    to: string;
                };
                tjzn9ne: {
                    as: string;
                    from: string;
                    to: string;
                };
                tksk4wc: {
                    as: string;
                    from: string;
                    to: string;
                };
                u4k2auv: {
                    as: string;
                    from: string;
                    to: string;
                };
                v0qabyr: {
                    as: string;
                    from: string;
                    to: string;
                };
                vgishln: {
                    as: string;
                    from: string;
                    to: string;
                };
                x4fmyaa: {
                    as: string;
                    from: string;
                    to: string;
                };
                x4vnm62: {
                    as: string;
                    from: string;
                    to: string;
                };
                y407zfo: {
                    as: string;
                    from: string;
                    to: string;
                };
                yv0o41n: {
                    as: string;
                    from: string;
                    to: string;
                };
                z3jopgg: {
                    as: string;
                    from: string;
                    to: string;
                };
                z8c7kcy: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            nodes: {
                "0i85qjj": {
                    id: string;
                };
                "1dhoyv2": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "24q0egm": {
                    id: string;
                };
                "2wp8ffd": {
                    id: string;
                    ref: string;
                };
                "34k9xvb": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "4dh6wzn": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "4subc0j": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "5mog0bc": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "7c2vt3d": {
                    id: string;
                    ref: string;
                };
                "8f3izp7": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "93rx3ru": {
                    id: string;
                    value: string;
                };
                a6rdag9: {
                    id: string;
                };
                av63lw9: {
                    id: string;
                    value: string;
                    ref: string;
                };
                bts7694: {
                    id: string;
                    ref: string;
                    value: string;
                };
                d1wcpk1: {
                    id: string;
                    ref: string;
                    value: string;
                };
                d86emo2: {
                    id: string;
                    ref: string;
                };
                doz740g: {
                    id: string;
                    ref: string;
                };
                e996mm5: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ewycyaq: {
                    id: string;
                    ref: string;
                };
                ezx9hxj: {
                    id: string;
                };
                fd7yax9: {
                    id: string;
                    ref: string;
                    value: string;
                };
                fgmcy0x: {
                    id: string;
                    value: string;
                };
                gibdj45: {
                    id: string;
                    ref: string;
                    value: string;
                };
                gtpf6x9: {
                    id: string;
                    ref: string;
                    value: string;
                };
                gvk9hec: {
                    id: string;
                    ref: string;
                };
                h19qe28: {
                    id: string;
                    value: string;
                };
                ku4l1v6: {
                    id: string;
                    ref: string;
                    value: string;
                };
                kyu6h8m: {
                    id: string;
                    ref: string;
                };
                l5bzesi: {
                    id: string;
                    ref: string;
                    value: string;
                };
                lptf53h: {
                    id: string;
                    ref: string;
                };
                mpbvtrq: {
                    id: string;
                    value: string;
                };
                n4i4t17: {
                    id: string;
                    ref: string;
                    value: string;
                };
                nrhhdip: {
                    id: string;
                    ref: string;
                    value: string;
                };
                obkkk9p: {
                    id: string;
                    ref: string;
                    value: string;
                };
                old0t0c: {
                    id: string;
                    ref: string;
                };
                on0cfjb: {
                    id: string;
                    ref: string;
                    value: string;
                };
                oqbuspj: {
                    id: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                parseval: {
                    id: string;
                    ref: string;
                    value: string;
                };
                q09a315: {
                    id: string;
                    ref: string;
                    value: string;
                };
                q8ugbch: {
                    id: string;
                    value: string;
                };
                r0fsdrm: {
                    id: string;
                    ref: string;
                    value: string;
                };
                r1ah7g2: {
                    id: string;
                    value: string;
                };
                racg3p7: {
                    id: string;
                    ref: string;
                    value: string;
                };
                sb9qdgy: {
                    id: string;
                    ref: string;
                };
                slidervalpublish: {
                    id: string;
                    value: string;
                };
                sv49nso: {
                    id: string;
                    ref: string;
                    value: string;
                };
                sxjhepz: {
                    id: string;
                };
                t1deznd: {
                    id: string;
                    ref: string;
                };
                tjzn9ne: {
                    id: string;
                    ref: string;
                    value: string;
                };
                tksk4wc: {
                    id: string;
                    ref: string;
                };
                u4k2auv: {
                    id: string;
                    value: string;
                };
                v0qabyr: {
                    id: string;
                    ref: string;
                };
                vgishln: {
                    id: string;
                    ref: string;
                    value: string;
                };
                x4fmyaa: {
                    id: string;
                    ref: string;
                    value: string;
                };
                x4vnm62: {
                    id: string;
                    ref: string;
                    value: string;
                };
                y407zfo: {
                    id: string;
                    ref: string;
                };
                yv0o41n: {
                    id: string;
                    ref: string;
                };
                z3jopgg: {
                    id: string;
                    ref: string;
                    value: string;
                };
                z8c7kcy: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
        };
        "@nodysseus.export": {
            category: string;
            edges: {
                args: {
                    as: string;
                    from: string;
                    to: string;
                };
                jklqh38: {
                    as: string;
                    from: string;
                    to: string;
                };
                "6qkew20": {
                    as: string;
                    from: string;
                    to: string;
                };
                "3y8pyc2": {
                    as: string;
                    from: string;
                    to: string;
                };
                "8dy573e": {
                    as: string;
                    from: string;
                    to: string;
                };
                pcx97n4: {
                    as: string;
                    from: string;
                    to: string;
                };
                rk7hcxc: {
                    as: string;
                    from: string;
                    to: string;
                };
                "91lhfar": {
                    as: string;
                    from: string;
                    to: string;
                };
                b8wohxv: {
                    as: string;
                    from: string;
                    to: string;
                };
                x200f4j: {
                    as: string;
                    from: string;
                    to: string;
                };
                "91lhfar_arr": {
                    as: string;
                    from: string;
                    to: string;
                };
                zpv5bk2: {
                    as: string;
                    from: string;
                    to: string;
                };
                "6dadrg0": {
                    as: string;
                    from: string;
                    to: string;
                };
                "898n6f7": {
                    as: string;
                    from: string;
                    to: string;
                };
                i5wnhvh: {
                    as: string;
                    from: string;
                    to: string;
                };
                mp0ce5t: {
                    as: string;
                    from: string;
                    to: string;
                };
                zucq3k4: {
                    as: string;
                    from: string;
                    to: string;
                };
                "8470sfe": {
                    as: string;
                    from: string;
                    to: string;
                };
                hke54sp: {
                    as: string;
                    from: string;
                    to: string;
                };
                syfso39: {
                    as: string;
                    from: string;
                    to: string;
                };
                "5ym155p": {
                    as: string;
                    from: string;
                    to: string;
                };
                aem1lk9: {
                    as: string;
                    from: string;
                    to: string;
                };
                kaiwusy: {
                    as: string;
                    from: string;
                    to: string;
                };
                "0pnyh3t": {
                    as: string;
                    from: string;
                    to: string;
                };
                "959i120": {
                    as: string;
                    from: string;
                    to: string;
                };
                i60dlmh: {
                    as: string;
                    from: string;
                    to: string;
                };
                x8ik3x4: {
                    as: string;
                    from: string;
                    to: string;
                };
                g7pa2bl: {
                    as: string;
                    from: string;
                    to: string;
                };
                l4o1umt: {
                    as: string;
                    from: string;
                    to: string;
                };
                refspromise: {
                    as: string;
                    from: string;
                    to: string;
                };
                w78q6vm: {
                    as: string;
                    from: string;
                    to: string;
                };
                "1axuplc": {
                    as: string;
                    from: string;
                    to: string;
                };
                "47sbfib": {
                    as: string;
                    from: string;
                    to: string;
                };
                obg8j8v: {
                    as: string;
                    from: string;
                    to: string;
                };
                "690ivn1": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9jvfgj1": {
                    as: string;
                    from: string;
                    to: string;
                };
                j2c518b: {
                    as: string;
                    from: string;
                    to: string;
                };
                qpiqhgp: {
                    as: string;
                    from: string;
                    to: string;
                };
                n7aaoju: {
                    as: string;
                    from: string;
                    to: string;
                };
                zihm1kd: {
                    as: string;
                    from: string;
                    to: string;
                };
                "2dz33fg": {
                    as: string;
                    from: string;
                    to: string;
                };
                jdoak4g: {
                    as: string;
                    from: string;
                    to: string;
                };
                pni2xuu: {
                    as: string;
                    from: string;
                    to: string;
                };
                ug26ugw: {
                    as: string;
                    from: string;
                    to: string;
                };
                jdufmth: {
                    as: string;
                    from: string;
                    to: string;
                };
                et5g0m1: {
                    as: string;
                    from: string;
                    to: string;
                };
                xdot36k: {
                    as: string;
                    from: string;
                    to: string;
                };
                tfwqhqf: {
                    as: string;
                    from: string;
                    to: string;
                };
                "2yur4h7": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9tv13iq": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1edrrwq": {
                    as: string;
                    from: string;
                    to: string;
                };
                "6ag8lnc": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9rf8bds": {
                    as: string;
                    from: string;
                    to: string;
                };
                skqnl08: {
                    as: string;
                    from: string;
                    to: string;
                };
                xp4pv1h: {
                    as: string;
                    from: string;
                    to: string;
                };
                dd6st1b: {
                    as: string;
                    from: string;
                    to: string;
                };
                "3b7bnzm": {
                    as: string;
                    from: string;
                    to: string;
                };
                tad7830: {
                    as: string;
                    from: string;
                    to: string;
                };
                a1vqjzz: {
                    from: string;
                    to: string;
                    as: string;
                };
                "8zvzwb5": {
                    from: string;
                    to: string;
                    as: string;
                };
                o7cn2a9: {
                    from: string;
                    to: string;
                    as: string;
                };
                db0reg4: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            id: string;
            nodes: {
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                jklqh38: {
                    id: string;
                    ref: string;
                };
                "6qkew20": {
                    id: string;
                    ref: string;
                };
                pcx97n4: {
                    id: string;
                    ref: string;
                    value: string;
                };
                rk7hcxc: {
                    id: string;
                };
                x200f4j: {
                    id: string;
                    value: string;
                };
                b8wohxv: {
                    id: string;
                    value: string;
                };
                "91lhfar": {
                    id: string;
                    ref: string;
                };
                zpv5bk2: {
                    id: string;
                };
                "6dadrg0": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "91lhfar_arr": {
                    id: string;
                    ref: string;
                };
                i5wnhvh: {
                    id: string;
                    ref: string;
                };
                zucq3k4: {
                    id: string;
                };
                "8470sfe": {
                    id: string;
                    ref: string;
                    value: string;
                };
                hke54sp: {
                    id: string;
                    ref: string;
                    value: string;
                };
                syfso39: {
                    id: string;
                    ref: string;
                };
                "5ym155p": {
                    id: string;
                };
                kaiwusy: {
                    id: string;
                    ref: string;
                    value: string;
                };
                db0reg4: {
                    id: string;
                    ref: string;
                };
                "959i120": {
                    id: string;
                    ref: string;
                };
                x8ik3x4: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8zvzwb5": {
                    id: string;
                    value: string;
                    ref: string;
                };
                a1vqjzz: {
                    id: string;
                    ref: string;
                    value: string;
                };
                i60dlmh: {
                    id: string;
                };
                g7pa2bl: {
                    id: string;
                };
                "0pnyh3t": {
                    id: string;
                    ref: string;
                    value: string;
                };
                l4o1umt: {
                    id: string;
                    ref: string;
                    value: string;
                };
                w78q6vm: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1axuplc": {
                    id: string;
                    ref: string;
                    value: string;
                };
                refspromise: {
                    id: string;
                    ref: string;
                    value: string;
                };
                aem1lk9: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "47sbfib": {
                    id: string;
                    ref: string;
                    value: string;
                };
                obg8j8v: {
                    id: string;
                    ref: string;
                    value: string;
                };
                mp0ce5t: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "898n6f7": {
                    id: string;
                    ref: string;
                };
                "9jvfgj1": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "690ivn1": {
                    id: string;
                    ref: string;
                    value: string;
                };
                j2c518b: {
                    id: string;
                };
                qpiqhgp: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                    value: string;
                };
                zihm1kd: {
                    id: string;
                };
                pni2xuu: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ug26ugw: {
                    id: string;
                    name: string;
                    ref: string;
                    value: string;
                };
                jdoak4g: {
                    id: string;
                    ref: string;
                    value: string;
                };
                jdufmth: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "2dz33fg": {
                    id: string;
                    value: string;
                };
                n7aaoju: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "3y8pyc2": {
                    id: string;
                    ref: string;
                    value: string;
                };
                xdot36k: {
                    id: string;
                };
                tfwqhqf: {
                    id: string;
                    value: string;
                };
                et5g0m1: {
                    id: string;
                    ref: string;
                };
                "9tv13iq": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "2yur4h7": {
                    id: string;
                    ref: string;
                };
                "6ag8lnc": {
                    id: string;
                };
                "9rf8bds": {
                    id: string;
                };
                "1edrrwq": {
                    id: string;
                    ref: string;
                    value: string;
                };
                skqnl08: {
                    id: string;
                    ref: string;
                };
                xp4pv1h: {
                    id: string;
                    ref: string;
                    value: string;
                };
                dd6st1b: {
                    id: string;
                    ref: string;
                    value: string;
                };
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                tad7830: {
                    id: string;
                    ref: string;
                };
                "3b7bnzm": {
                    id: string;
                    ref: string;
                };
                o7cn2a9: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            out: string;
        };
        "@memory.assetmanager": {
            id: string;
            out: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qgbinm2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                output_val: {
                    id: string;
                    value: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                "46kgw03": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "4nx9x10": {
                    id: string;
                    ref: string;
                };
                rrgshuq: {
                    id: string;
                    value: string;
                    ref: string;
                };
                chkprox: {
                    id: string;
                    ref: string;
                };
                "5hesw9s": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "49od031": {
                    id: string;
                    ref: string;
                };
                h1z2zqq: {
                    id: string;
                    value: string;
                    ref: string;
                };
                znw0jq1: {
                    id: string;
                    value: string;
                    ref: string;
                };
                xiv2pw0: {
                    id: string;
                };
                yx1sv0e: {
                    id: string;
                };
                zk03lef: {
                    id: string;
                };
                "23vrr6n": {
                    id: string;
                    value: string;
                    ref: string;
                };
                md80upr: {
                    id: string;
                };
                zhoffc7: {
                    id: string;
                    ref: string;
                };
                "4zueto7": {
                    id: string;
                };
                "5ndg5og": {
                    id: string;
                    value: string;
                };
                "10ozygd": {
                    id: string;
                    ref: string;
                };
                "6zb4hho": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "6c04ryh": {
                    id: string;
                    value: string;
                    ref: string;
                };
                d4sx4ej: {
                    id: string;
                    value: string;
                    ref: string;
                };
                drkjew9: {
                    id: string;
                };
                "12i36ht": {
                    id: string;
                    ref: string;
                };
                gwslf7p: {
                    id: string;
                };
                g6loz00: {
                    id: string;
                    ref: string;
                };
                "7ny91r3": {
                    id: string;
                    value: string;
                    ref: string;
                };
                vg773lv: {
                    id: string;
                    value: string;
                    ref: string;
                };
                jhyu5pk: {
                    id: string;
                };
                gnuhmpf: {
                    id: string;
                    value: string;
                    ref: string;
                };
                dh814lx: {
                    id: string;
                    value: string;
                    ref: string;
                };
                mhqejl5: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "1090db5": {
                    id: string;
                    ref: string;
                };
                xuyat95: {
                    id: string;
                    ref: string;
                };
                mk4gru0: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "9ucfrui": {
                    id: string;
                    ref: string;
                };
                "1ts2j8n": {
                    id: string;
                };
                gzki6r1: {
                    id: string;
                    value: string;
                    ref: string;
                };
                l7ahauw: {
                    id: string;
                    value: string;
                    ref: string;
                };
                nhruqy5: {
                    id: string;
                    value: string;
                };
                g7ew1lp: {
                    id: string;
                    value: string;
                    ref: string;
                };
                riqk7hm: {
                    id: string;
                    value: string;
                    ref: string;
                };
                b9gbfro: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                qgbinm2: {
                    from: string;
                    to: string;
                    as: string;
                };
                "8dy573e": {
                    from: string;
                    to: string;
                    as: string;
                };
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
                rrgshuq: {
                    from: string;
                    to: string;
                    as: string;
                };
                chkprox: {
                    from: string;
                    to: string;
                    as: string;
                };
                "5hesw9s": {
                    from: string;
                    to: string;
                    as: string;
                };
                "49od031": {
                    from: string;
                    to: string;
                    as: string;
                };
                h1z2zqq: {
                    from: string;
                    to: string;
                    as: string;
                };
                znw0jq1: {
                    from: string;
                    to: string;
                    as: string;
                };
                xiv2pw0: {
                    from: string;
                    to: string;
                    as: string;
                };
                yx1sv0e: {
                    from: string;
                    to: string;
                    as: string;
                };
                zk03lef: {
                    from: string;
                    to: string;
                    as: string;
                };
                "23vrr6n": {
                    from: string;
                    to: string;
                    as: string;
                };
                md80upr: {
                    from: string;
                    to: string;
                    as: string;
                };
                zhoffc7: {
                    from: string;
                    to: string;
                    as: string;
                };
                "4zueto7": {
                    from: string;
                    to: string;
                    as: string;
                };
                "5ndg5og": {
                    from: string;
                    to: string;
                    as: string;
                };
                "10ozygd": {
                    from: string;
                    to: string;
                    as: string;
                };
                "6zb4hho": {
                    from: string;
                    to: string;
                    as: string;
                };
                "6c04ryh": {
                    from: string;
                    to: string;
                    as: string;
                };
                d4sx4ej: {
                    from: string;
                    to: string;
                    as: string;
                };
                drkjew9: {
                    from: string;
                    to: string;
                    as: string;
                };
                "12i36ht": {
                    from: string;
                    to: string;
                    as: string;
                };
                gwslf7p: {
                    from: string;
                    to: string;
                    as: string;
                };
                g6loz00: {
                    from: string;
                    to: string;
                    as: string;
                };
                "7ny91r3": {
                    from: string;
                    to: string;
                    as: string;
                };
                vg773lv: {
                    from: string;
                    to: string;
                    as: string;
                };
                jhyu5pk: {
                    from: string;
                    to: string;
                    as: string;
                };
                gnuhmpf: {
                    from: string;
                    to: string;
                    as: string;
                };
                dh814lx: {
                    from: string;
                    to: string;
                    as: string;
                };
                mhqejl5: {
                    from: string;
                    to: string;
                    as: string;
                };
                b9gbfro: {
                    from: string;
                    to: string;
                    as: string;
                };
                riqk7hm: {
                    from: string;
                    to: string;
                    as: string;
                };
                xuyat95: {
                    from: string;
                    to: string;
                    as: string;
                };
                "9ucfrui": {
                    from: string;
                    to: string;
                    as: string;
                };
                mk4gru0: {
                    from: string;
                    to: string;
                    as: string;
                };
                g7ew1lp: {
                    from: string;
                    to: string;
                    as: string;
                };
                nhruqy5: {
                    from: string;
                    to: string;
                    as: string;
                };
                "1ts2j8n": {
                    from: string;
                    to: string;
                    as: string;
                };
                gzki6r1: {
                    from: string;
                    to: string;
                    as: string;
                };
                l7ahauw: {
                    from: string;
                    to: string;
                    as: string;
                };
                "1090db5": {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            category: string;
        };
        "@math.fit": {
            id: string;
            out: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qgbinm2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                output_val: {
                    id: string;
                    value: string;
                    ref: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                "5locpe3": {
                    id: string;
                    value: string;
                    ref: string;
                };
                a8kr545: {
                    id: string;
                    value: string;
                    ref: string;
                };
                s9mrg9v: {
                    id: string;
                    value: string;
                    ref: string;
                };
                y1hnt8t: {
                    id: string;
                    value: string;
                    ref: string;
                };
                fma0geo: {
                    id: string;
                    value: string;
                    ref: string;
                };
                s351p91: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                qgbinm2: {
                    from: string;
                    to: string;
                    as: string;
                };
                "8dy573e": {
                    from: string;
                    to: string;
                    as: string;
                };
                output_val: {
                    from: string;
                    to: string;
                    as: string;
                };
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
                "5locpe3": {
                    from: string;
                    to: string;
                    as: string;
                };
                a8kr545: {
                    from: string;
                    to: string;
                    as: string;
                };
                s9mrg9v: {
                    from: string;
                    to: string;
                    as: string;
                };
                y1hnt8t: {
                    from: string;
                    to: string;
                    as: string;
                };
                fma0geo: {
                    from: string;
                    to: string;
                    as: string;
                };
                s351p91: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            category: string;
        };
        "@flow.switch_inputs": {
            id: string;
            out: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                "6280gtl": {
                    id: string;
                    ref: string;
                };
                gqi2qi3: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "9r6mj9s": {
                    id: string;
                };
                "8f9x43u": {
                    id: string;
                    ref: string;
                };
                "2j5rxq0": {
                    id: string;
                };
                q0h1zer: {
                    id: string;
                    value: string;
                    ref: string;
                };
                hyw65dk: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ddhrxjw: {
                    id: string;
                    ref: string;
                };
                "4ujfj58": {
                    id: string;
                    value: string;
                    ref: string;
                };
                s35ms5l: {
                    id: string;
                    value: string;
                    ref: string;
                };
                jdajqk3: {
                    id: string;
                    ref: string;
                };
                evpcvvi: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "86zvrx4": {
                    id: string;
                    value: string;
                    ref: string;
                };
                m24351r: {
                    id: string;
                };
                "1s77djh": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "65wrg0t": {
                    id: string;
                    ref: string;
                };
                y5r6re6: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "0adxu2g": {
                    id: string;
                };
                vz8dmxf: {
                    id: string;
                };
                "77z7u64": {
                    id: string;
                    ref: string;
                };
                "4w1wh15": {
                    id: string;
                    value: string;
                };
                fob1r0t: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "7uzzghh": {
                    id: string;
                    value: string;
                    ref: string;
                };
                meoy2m1: {
                    id: string;
                    ref: string;
                };
                p53f7fz: {
                    id: string;
                    value: string;
                    ref: string;
                };
                c8500l8: {
                    id: string;
                    value: string;
                    ref: string;
                };
                dqzwfa3: {
                    id: string;
                    ref: string;
                };
                y1oibqk: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pbl7fry: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                "8dy573e": {
                    from: string;
                    to: string;
                    as: string;
                };
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
                "6280gtl": {
                    from: string;
                    to: string;
                    as: string;
                };
                ddhrxjw: {
                    from: string;
                    to: string;
                    as: string;
                };
                "9r6mj9s": {
                    from: string;
                    to: string;
                    as: string;
                };
                "8f9x43u": {
                    from: string;
                    to: string;
                    as: string;
                };
                hyw65dk: {
                    from: string;
                    to: string;
                    as: string;
                };
                "2j5rxq0": {
                    from: string;
                    to: string;
                    as: string;
                };
                q0h1zer: {
                    from: string;
                    to: string;
                    as: string;
                };
                jdajqk3: {
                    from: string;
                    to: string;
                    as: string;
                };
                "4ujfj58": {
                    from: string;
                    to: string;
                    as: string;
                };
                s35ms5l: {
                    from: string;
                    to: string;
                    as: string;
                };
                evpcvvi: {
                    from: string;
                    to: string;
                    as: string;
                };
                m24351r: {
                    from: string;
                    to: string;
                    as: string;
                };
                "86zvrx4": {
                    from: string;
                    to: string;
                    as: string;
                };
                "1s77djh": {
                    from: string;
                    to: string;
                    as: string;
                };
                gqi2qi3: {
                    from: string;
                    to: string;
                    as: string;
                };
                "65wrg0t": {
                    from: string;
                    to: string;
                    as: string;
                };
                y5r6re6: {
                    from: string;
                    to: string;
                    as: string;
                };
                "0adxu2g": {
                    from: string;
                    to: string;
                    as: string;
                };
                vz8dmxf: {
                    from: string;
                    to: string;
                    as: string;
                };
                "77z7u64": {
                    from: string;
                    to: string;
                    as: string;
                };
                "4w1wh15": {
                    from: string;
                    to: string;
                    as: string;
                };
                fob1r0t: {
                    from: string;
                    to: string;
                    as: string;
                };
                "7uzzghh": {
                    from: string;
                    to: string;
                    as: string;
                };
                meoy2m1: {
                    from: string;
                    to: string;
                    as: string;
                };
                c8500l8: {
                    from: string;
                    to: string;
                    as: string;
                };
                p53f7fz: {
                    from: string;
                    to: string;
                    as: string;
                };
                dqzwfa3: {
                    from: string;
                    to: string;
                    as: string;
                };
                pbl7fry: {
                    from: string;
                    to: string;
                    as: string;
                };
                y1oibqk: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            category: string;
        };
        "@memory.store_file": {
            id: string;
            category: string;
            nodes: {
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                arcnyff: {
                    id: string;
                    ref: string;
                };
                qgbinm2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                rtrp3nj: {
                    id: string;
                    value: string;
                    ref: string;
                };
                vnibm4q: {
                    id: string;
                };
                "07fjn2b": {
                    id: string;
                    value: string;
                };
                jmqcpll: {
                    id: string;
                    ref: string;
                };
                o9ukwn8: {
                    id: string;
                    value: string;
                    ref: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                "1672j69": {
                    id: string;
                    value: string;
                    ref: string;
                };
                qzp14wr: {
                    id: string;
                    value: string;
                    ref: string;
                };
                v99fk3p: {
                    id: string;
                    ref: string;
                };
                y58g8pm: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pldugnx: {
                    id: string;
                };
                ceomp2r: {
                    id: string;
                    ref: string;
                };
                uyspmvr: {
                    id: string;
                    value: string;
                    ref: string;
                };
                psxdib2: {
                    id: string;
                    ref: string;
                };
                nxdj21x: {
                    id: string;
                };
                gsrb9e6: {
                    id: string;
                };
                "4j186m3": {
                    id: string;
                    value: string;
                };
                rdt0k55: {
                    id: string;
                    value: string;
                };
                gi30q1h: {
                    id: string;
                };
                "0clgvk2": {
                    id: string;
                    value: string;
                    ref: string;
                };
                yj9sw4x: {
                    id: string;
                    value: string;
                    ref: string;
                };
                c0gcfke: {
                    id: string;
                    value: string;
                    ref: string;
                };
                qh60wjb: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ncih0ts: {
                    id: string;
                    value: string;
                    ref: string;
                };
                zugbd71: {
                    id: string;
                    ref: string;
                };
                fmostjp: {
                    id: string;
                    value: string;
                    ref: string;
                };
                hj6upcm: {
                    id: string;
                    ref: string;
                };
                eviegts: {
                    id: string;
                    value: string;
                    ref: string;
                };
                kldqqu0: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ic7fy1m: {
                    id: string;
                    value: string;
                    ref: string;
                };
                yx80n2x: {
                    id: string;
                    ref: string;
                };
                "2qd7694": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5mfdcg0": {
                    id: string;
                };
                izkowx6: {
                    id: string;
                    ref: string;
                };
                i6lfbjh: {
                    id: string;
                    value: string;
                    ref: string;
                };
                b444vmf: {
                    id: string;
                    ref: string;
                };
                lpet497: {
                    id: string;
                    value: string;
                    ref: string;
                };
                lkz76u7: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "6t8kqs9": {
                    id: string;
                    ref: string;
                };
                ke8lvin: {
                    id: string;
                    value: string;
                    ref: string;
                };
                j7ct5iw: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                from: string;
                to: string;
                as: string;
            }[];
            out: string;
        };
        "@data.ischanged": {
            id: string;
            nodes: {
                in: {
                    id: string;
                };
                eq_fn_value: {
                    id: string;
                    ref: string;
                    value: string;
                };
                eq_fn_if: {
                    id: string;
                    ref: string;
                    value: string;
                };
                fn: {
                    id: string;
                    ref: string;
                    value: string;
                };
                cached: {
                    id: string;
                    ref: string;
                    value: string;
                    type: string;
                };
                eq_default: {
                    id: string;
                    ref: string;
                };
                eq_runnable: {
                    id: string;
                    ref: string;
                };
                fn_runnable: {
                    id: string;
                    ref: string;
                };
                eq_fn_runnable: {
                    id: string;
                    ref: string;
                    value: string;
                };
                eq_fn: {
                    id: string;
                    ref: string;
                };
                eq_fn_return_args: {
                    id: string;
                };
                if_eq_fn: {
                    id: string;
                    ref: string;
                };
                out: {
                    id: string;
                    ref: string;
                    name: string;
                };
                yp2q57b: {
                    id: string;
                };
                tpe5t4z: {
                    id: string;
                    ref: string;
                };
                cy1tm8s: {
                    id: string;
                    value: string;
                    ref: string;
                };
                khdzxds: {
                    id: string;
                    value: string;
                    ref: string;
                };
                lv2gcpk: {
                    id: string;
                    value: string;
                    ref: string;
                };
            };
            edges: {
                eq_default: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_runnable: {
                    from: string;
                    to: string;
                    as: string;
                };
                fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                fn_runnable: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn_value: {
                    from: string;
                    to: string;
                    as: string;
                };
                cached: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn_runnable: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn_if: {
                    from: string;
                    to: string;
                    as: string;
                };
                eq_fn: {
                    from: string;
                    to: string;
                    as: string;
                };
                yp2q57b: {
                    from: string;
                    to: string;
                    as: string;
                };
                tpe5t4z: {
                    from: string;
                    to: string;
                    as: string;
                };
                cy1tm8s: {
                    from: string;
                    to: string;
                    as: string;
                };
                khdzxds: {
                    from: string;
                    to: string;
                    as: string;
                };
                lv2gcpk: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
            category: string;
        };
        "@audio.tapbeat": {
            edges: {
                "07e1bfn": {
                    as: string;
                    from: string;
                    to: string;
                };
                "113q4li": {
                    as: string;
                    from: string;
                    to: string;
                };
                "13e4el1": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1484wjz": {
                    as: string;
                    from: string;
                    to: string;
                };
                "151za0r": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1fuixnh": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1qcwz4u": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1t3aqnb": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1zhv7p5": {
                    as: string;
                    from: string;
                    to: string;
                };
                "201yzow": {
                    as: string;
                    from: string;
                    to: string;
                };
                "33dadts": {
                    as: string;
                    from: string;
                    to: string;
                };
                "3bf8axp": {
                    as: string;
                    from: string;
                    to: string;
                };
                "3y9h7wd": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4113r3s": {
                    as: string;
                    from: string;
                    to: string;
                };
                "47b969g": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4dgggsq": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4j7h0bp": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4q5sykk": {
                    as: string;
                    from: string;
                    to: string;
                };
                "5cn0o7r": {
                    as: string;
                    from: string;
                    to: string;
                };
                "5oh2s6z": {
                    as: string;
                    from: string;
                    to: string;
                };
                "6qgqv3l": {
                    as: string;
                    from: string;
                    to: string;
                };
                "6rtxmde": {
                    as: string;
                    from: string;
                    to: string;
                };
                "70h3dpo": {
                    as: string;
                    from: string;
                    to: string;
                };
                "7hx0d36": {
                    as: string;
                    from: string;
                    to: string;
                };
                "7jjupav": {
                    as: string;
                    from: string;
                    to: string;
                };
                "7m5r1ix": {
                    as: string;
                    from: string;
                    to: string;
                };
                "7zogdg5": {
                    as: string;
                    from: string;
                    to: string;
                };
                "804ufg4": {
                    as: string;
                    from: string;
                    to: string;
                };
                "8dy573e": {
                    as: string;
                    from: string;
                    to: string;
                };
                "8gtm109": {
                    as: string;
                    from: string;
                    to: string;
                };
                "8ywgts7": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9fogdzn": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9ikgefi": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9vqinsg": {
                    as: string;
                    from: string;
                    to: string;
                };
                a14g4yc: {
                    as: string;
                    from: string;
                    to: string;
                };
                args: {
                    as: string;
                    from: string;
                    to: string;
                };
                b4nhbtt: {
                    as: string;
                    from: string;
                    to: string;
                };
                bftgd51: {
                    as: string;
                    from: string;
                    to: string;
                };
                bqz7j3e: {
                    as: string;
                    from: string;
                    to: string;
                };
                byap9s1: {
                    as: string;
                    from: string;
                    to: string;
                };
                cnsnetw: {
                    as: string;
                    from: string;
                    to: string;
                };
                cubknyo: {
                    as: string;
                    from: string;
                    to: string;
                };
                cx9aa91: {
                    as: string;
                    from: string;
                    to: string;
                };
                d21woh4: {
                    as: string;
                    from: string;
                    to: string;
                };
                d3crr2f: {
                    as: string;
                    from: string;
                    to: string;
                };
                dcz42hs: {
                    as: string;
                    from: string;
                    to: string;
                };
                dvvevhq: {
                    as: string;
                    from: string;
                    to: string;
                };
                dw8xjx3: {
                    as: string;
                    from: string;
                    to: string;
                };
                e1t6r15: {
                    as: string;
                    from: string;
                    to: string;
                };
                ecro2kn: {
                    as: string;
                    from: string;
                    to: string;
                };
                eemfhib: {
                    as: string;
                    from: string;
                    to: string;
                };
                eh8vkbv: {
                    as: string;
                    from: string;
                    to: string;
                };
                ehximpo: {
                    as: string;
                    from: string;
                    to: string;
                };
                ekjdg2h: {
                    as: string;
                    from: string;
                    to: string;
                };
                fh7zimm: {
                    as: string;
                    from: string;
                    to: string;
                };
                g19y12v: {
                    as: string;
                    from: string;
                    to: string;
                };
                g8c1ctx: {
                    as: string;
                    from: string;
                    to: string;
                };
                getkche: {
                    as: string;
                    from: string;
                    to: string;
                };
                ghdbxof: {
                    as: string;
                    from: string;
                    to: string;
                };
                gov7mj3: {
                    as: string;
                    from: string;
                    to: string;
                };
                gz1klgh: {
                    as: string;
                    from: string;
                    to: string;
                };
                hbkg26p: {
                    as: string;
                    from: string;
                    to: string;
                };
                hbo5tmq: {
                    as: string;
                    from: string;
                    to: string;
                };
                hhtc498: {
                    as: string;
                    from: string;
                    to: string;
                };
                i38qweq: {
                    as: string;
                    from: string;
                    to: string;
                };
                i4hvk0h: {
                    as: string;
                    from: string;
                    to: string;
                };
                j2hh8em: {
                    as: string;
                    from: string;
                    to: string;
                };
                kdsdigz: {
                    as: string;
                    from: string;
                    to: string;
                };
                kf98qgd: {
                    as: string;
                    from: string;
                    to: string;
                };
                khnbkwz: {
                    as: string;
                    from: string;
                    to: string;
                };
                khukm2f: {
                    as: string;
                    from: string;
                    to: string;
                };
                kogmro5: {
                    as: string;
                    from: string;
                    to: string;
                };
                l07y6lz: {
                    as: string;
                    from: string;
                    to: string;
                };
                l0hqlvw: {
                    as: string;
                    from: string;
                    to: string;
                };
                l1zpo0i: {
                    as: string;
                    from: string;
                    to: string;
                };
                l5h156b: {
                    as: string;
                    from: string;
                    to: string;
                };
                lex0hr5: {
                    as: string;
                    from: string;
                    to: string;
                };
                lgx7u5i: {
                    as: string;
                    from: string;
                    to: string;
                };
                lkpcx2e: {
                    as: string;
                    from: string;
                    to: string;
                };
                lm86y5w: {
                    as: string;
                    from: string;
                    to: string;
                };
                lnpoih5: {
                    as: string;
                    from: string;
                    to: string;
                };
                lozphpd: {
                    as: string;
                    from: string;
                    to: string;
                };
                ls56kix: {
                    as: string;
                    from: string;
                    to: string;
                };
                mq1crnf: {
                    as: string;
                    from: string;
                    to: string;
                };
                mql26eq: {
                    as: string;
                    from: string;
                    to: string;
                };
                n0mauz7: {
                    as: string;
                    from: string;
                    to: string;
                };
                n2a984s: {
                    as: string;
                    from: string;
                    to: string;
                };
                n8ppok6: {
                    as: string;
                    from: string;
                    to: string;
                };
                nbvoq40: {
                    as: string;
                    from: string;
                    to: string;
                };
                numz8ak: {
                    as: string;
                    from: string;
                    to: string;
                };
                nva890x: {
                    as: string;
                    from: string;
                    to: string;
                };
                okonci6: {
                    as: string;
                    from: string;
                    to: string;
                };
                oy88wxs: {
                    as: string;
                    from: string;
                    to: string;
                };
                qgbinm2: {
                    as: string;
                    from: string;
                    to: string;
                };
                rwe5eea: {
                    as: string;
                    from: string;
                    to: string;
                };
                s1g8j99: {
                    as: string;
                    from: string;
                    to: string;
                };
                sa34rk4: {
                    as: string;
                    from: string;
                    to: string;
                };
                segmfh9: {
                    as: string;
                    from: string;
                    to: string;
                };
                si0nmli: {
                    as: string;
                    from: string;
                    to: string;
                };
                tqboq30: {
                    as: string;
                    from: string;
                    to: string;
                };
                tr1yujc: {
                    as: string;
                    from: string;
                    to: string;
                };
                v1az6xg: {
                    as: string;
                    from: string;
                    to: string;
                };
                vnxyyu1: {
                    as: string;
                    from: string;
                    to: string;
                };
                vp3ljbr: {
                    as: string;
                    from: string;
                    to: string;
                };
                w4gg9pv: {
                    as: string;
                    from: string;
                    to: string;
                };
                wds5v52: {
                    as: string;
                    from: string;
                    to: string;
                };
                wleyt8i: {
                    as: string;
                    from: string;
                    to: string;
                };
                wr1y755: {
                    as: string;
                    from: string;
                    to: string;
                };
                wrnn8a5: {
                    as: string;
                    from: string;
                    to: string;
                };
                wt1sz85: {
                    as: string;
                    from: string;
                    to: string;
                };
                wwj50tb: {
                    as: string;
                    from: string;
                    to: string;
                };
                wyuwdl4: {
                    as: string;
                    from: string;
                    to: string;
                };
                x2il2a2: {
                    as: string;
                    from: string;
                    to: string;
                };
                x9hdd1h: {
                    as: string;
                    from: string;
                    to: string;
                };
                ya1q4pd: {
                    as: string;
                    from: string;
                    to: string;
                };
                yd11ln1: {
                    as: string;
                    from: string;
                    to: string;
                };
                yxdrqfc: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            name: string;
            nodes: {
                "07e1bfn": {
                    id: string;
                    value: string;
                };
                "113q4li": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "13e4el1": {
                    id: string;
                    value: string;
                };
                "1484wjz": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "151za0r": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1fuixnh": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1qcwz4u": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1t3aqnb": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1zhv7p5": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "201yzow": {
                    id: string;
                };
                "33dadts": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "3bf8axp": {
                    id: string;
                    value: string;
                };
                "3y9h7wd": {
                    id: string;
                    value: string;
                };
                "4113r3s": {
                    id: string;
                    value: string;
                };
                "47b969g": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "4dgggsq": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "4j7h0bp": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "4q5sykk": {
                    id: string;
                    value: string;
                };
                "5cn0o7r": {
                    id: string;
                    ref: string;
                };
                "5oh2s6z": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "6qgqv3l": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "6rtxmde": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "70h3dpo": {
                    id: string;
                };
                "7hx0d36": {
                    id: string;
                    ref: string;
                };
                "7jjupav": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "7m5r1ix": {
                    id: string;
                    ref: string;
                };
                "7zogdg5": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "804ufg4": {
                    id: string;
                    value: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                "8gtm109": {
                    id: string;
                    ref: string;
                };
                "8hy2e88": {
                    id: string;
                };
                "8ywgts7": {
                    id: string;
                    ref: string;
                };
                "9fogdzn": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "9ikgefi": {
                    id: string;
                    ref: string;
                };
                "9vqinsg": {
                    id: string;
                };
                a14g4yc: {
                    id: string;
                    ref: string;
                    value: string;
                };
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                b4nhbtt: {
                    id: string;
                    value: string;
                };
                bftgd51: {
                    id: string;
                };
                bqz7j3e: {
                    id: string;
                    ref: string;
                    value: string;
                };
                byap9s1: {
                    id: string;
                };
                cnsnetw: {
                    id: string;
                    ref: string;
                };
                cubknyo: {
                    id: string;
                    ref: string;
                    value: string;
                };
                cx9aa91: {
                    id: string;
                    ref: string;
                };
                d21woh4: {
                    id: string;
                    value: string;
                };
                d3crr2f: {
                    id: string;
                    ref: string;
                };
                dcz42hs: {
                    id: string;
                    value: string;
                };
                dvvevhq: {
                    id: string;
                };
                dw8xjx3: {
                    id: string;
                    ref: string;
                    value: string;
                };
                e1t6r15: {
                    id: string;
                    value: string;
                };
                ecro2kn: {
                    id: string;
                    ref: string;
                };
                eemfhib: {
                    id: string;
                    ref: string;
                    value: string;
                };
                eh8vkbv: {
                    id: string;
                };
                ehximpo: {
                    id: string;
                };
                ekjdg2h: {
                    id: string;
                    ref: string;
                };
                fh7zimm: {
                    id: string;
                    ref: string;
                    value: string;
                };
                g19y12v: {
                    id: string;
                    ref: string;
                    value: string;
                };
                g8c1ctx: {
                    id: string;
                    ref: string;
                    value: string;
                };
                getkche: {
                    id: string;
                    ref: string;
                };
                ghdbxof: {
                    id: string;
                    ref: string;
                };
                gov7mj3: {
                    id: string;
                    ref: string;
                };
                gz1klgh: {
                    id: string;
                    ref: string;
                    value: string;
                };
                hbkg26p: {
                    id: string;
                    ref: string;
                    value: string;
                };
                hbo5tmq: {
                    id: string;
                    ref: string;
                };
                hhtc498: {
                    id: string;
                };
                i38qweq: {
                    id: string;
                    value: string;
                };
                i4hvk0h: {
                    id: string;
                };
                j2hh8em: {
                    id: string;
                    ref: string;
                    value: string;
                };
                kdsdigz: {
                    id: string;
                    ref: string;
                };
                kf98qgd: {
                    id: string;
                    ref: string;
                };
                khnbkwz: {
                    id: string;
                    ref: string;
                    value: string;
                };
                khukm2f: {
                    id: string;
                    ref: string;
                };
                kogmro5: {
                    id: string;
                    ref: string;
                    value: string;
                };
                l07y6lz: {
                    id: string;
                    value: string;
                };
                l0hqlvw: {
                    id: string;
                    ref: string;
                };
                l1zpo0i: {
                    id: string;
                    value: string;
                };
                l5h156b: {
                    id: string;
                    ref: string;
                    value: string;
                };
                lex0hr5: {
                    id: string;
                    ref: string;
                    value: string;
                };
                lgx7u5i: {
                    id: string;
                    ref: string;
                };
                lkpcx2e: {
                    id: string;
                    ref: string;
                    value: string;
                };
                lm86y5w: {
                    id: string;
                    ref: string;
                    value: string;
                };
                lnpoih5: {
                    id: string;
                    ref: string;
                    value: string;
                };
                lozphpd: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ls56kix: {
                    id: string;
                    ref: string;
                    value: string;
                };
                mq1crnf: {
                    id: string;
                    ref: string;
                };
                mql26eq: {
                    id: string;
                    value: string;
                };
                n0mauz7: {
                    id: string;
                    ref: string;
                    value: string;
                };
                n2a984s: {
                    id: string;
                    ref: string;
                };
                n8ppok6: {
                    id: string;
                    ref: string;
                };
                nbvoq40: {
                    id: string;
                    ref: string;
                };
                numz8ak: {
                    id: string;
                    ref: string;
                    value: string;
                };
                nva890x: {
                    id: string;
                    ref: string;
                };
                okonci6: {
                    id: string;
                    ref: string;
                    value: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                oy88wxs: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qgbinm2: {
                    id: string;
                    ref: string;
                    value: string;
                };
                rwe5eea: {
                    id: string;
                };
                s1g8j99: {
                    id: string;
                    ref: string;
                };
                sa34rk4: {
                    id: string;
                    ref: string;
                };
                segmfh9: {
                    id: string;
                    ref: string;
                    value: string;
                };
                si0nmli: {
                    id: string;
                    ref: string;
                };
                tqboq30: {
                    id: string;
                    ref: string;
                    value: string;
                };
                tr1yujc: {
                    id: string;
                };
                v1az6xg: {
                    id: string;
                };
                vnxyyu1: {
                    id: string;
                    ref: string;
                };
                vp3ljbr: {
                    id: string;
                    ref: string;
                    value: string;
                };
                w4gg9pv: {
                    id: string;
                    ref: string;
                };
                wds5v52: {
                    id: string;
                };
                wleyt8i: {
                    id: string;
                    ref: string;
                };
                wr1y755: {
                    id: string;
                    ref: string;
                    value: string;
                };
                wrnn8a5: {
                    id: string;
                };
                wt1sz85: {
                    id: string;
                    ref: string;
                    value: string;
                };
                wwj50tb: {
                    id: string;
                    ref: string;
                    value: string;
                };
                wyuwdl4: {
                    id: string;
                    ref: string;
                };
                x2il2a2: {
                    id: string;
                    ref: string;
                    value: string;
                };
                x9hdd1h: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ya1q4pd: {
                    id: string;
                    ref: string;
                    value: string;
                };
                yd11ln1: {
                    id: string;
                };
                yxdrqfc: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
            category: string;
        };
        "@audio.analysis": {
            id: string;
            out: string;
            nodes: {
                fhzn9j7: {
                    id: string;
                    value: string;
                    ref: string;
                };
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qgbinm2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                output_val: {};
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                jwib1ka: {
                    id: string;
                };
                hcp14pq: {
                    id: string;
                    ref: string;
                };
                avhgm5q: {
                    id: string;
                    value: string;
                };
                "56bla57": {
                    id: string;
                    value: string;
                    ref: string;
                };
                sd1ge10: {
                    id: string;
                    ref: string;
                };
                j7nk0p6: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "3mj0ula": {
                    id: string;
                    value: string;
                };
                f9t73iw: {
                    id: string;
                    ref: string;
                };
                hvkhebd: {
                    id: string;
                    value: string;
                    ref: string;
                };
                yi2ezh0: {
                    id: string;
                    value: string;
                    ref: string;
                };
                z6cwmqm: {
                    id: string;
                    value: string;
                    ref: string;
                };
                kcvpnbr: {
                    id: string;
                    ref: string;
                };
                ky27m6w: {
                    id: string;
                };
                cjn10vv: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "8b808yt": {
                    id: string;
                    value: string;
                    ref: string;
                };
                ntdapts: {
                    id: string;
                };
                i0ncdhp: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "202qikg": {
                    id: string;
                    value: string;
                    ref: string;
                };
                itqudjx: {
                    id: string;
                    value: string;
                    ref: string;
                };
                n12sjrc: {
                    id: string;
                    value: string;
                    ref: string;
                };
                lr9v8rm: {
                    id: string;
                    ref: string;
                };
                nnembhj: {
                    id: string;
                    value: string;
                    ref: string;
                };
                xfpzaer: {
                    id: string;
                    ref: string;
                };
                "32keuwb": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "58h53vb": {
                    id: string;
                };
                "7d5e83b": {
                    id: string;
                    value: string;
                };
                "0omg02e": {
                    id: string;
                };
                tfv9ab6: {
                    id: string;
                    value: string;
                    ref: string;
                };
                tjau54y: {
                    id: string;
                    ref: string;
                };
                z5v6iv9: {
                    id: string;
                    value: string;
                    ref: string;
                };
                k2n6i8q: {
                    id: string;
                    ref: string;
                };
                hkbnt7q: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "9pd2wms": {
                    id: string;
                    ref: string;
                };
                "4ng68ah": {
                    id: string;
                };
                bpcb53a: {
                    id: string;
                };
                crz99st: {
                    id: string;
                    value: string;
                    ref: string;
                };
                lokbjgu: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5clo4vh": {
                    id: string;
                };
                rbqic4e: {
                    id: string;
                    value: string;
                    ref: string;
                };
                bydhgr0: {
                    id: string;
                    value: string;
                    ref: string;
                };
                v7zp3ck: {
                    id: string;
                    ref: string;
                };
                "2nk866r": {
                    id: string;
                    value: string;
                    ref: string;
                };
                t4klpg0: {
                    id: string;
                    ref: string;
                };
                xgav7gf: {
                    id: string;
                    ref: string;
                };
                yzm2544: {
                    id: string;
                    ref: string;
                };
                boajzer: {
                    id: string;
                    value: string;
                    ref: string;
                };
                fw4v0e8: {
                    id: string;
                };
                enwnlrg: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "3cn9gm5": {
                    id: string;
                    value: string;
                    ref: string;
                };
                k81ohi2: {
                    id: string;
                    value: string;
                    ref: string;
                };
                kce6b36: {
                    id: string;
                    ref: string;
                };
                "3bzpqfw": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "7re12iu": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "9asxtzl": {
                    id: string;
                };
                or2do3i: {
                    id: string;
                    value: string;
                };
                d2m13om: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "5mrw162": {
                    id: string;
                    ref: string;
                };
                "152zzg7": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "9y1uozt": {
                    id: string;
                    value: string;
                    ref: string;
                };
                lhm1ktw: {
                    id: string;
                    value: string;
                    ref: string;
                };
                k780ign: {
                    id: string;
                    value: string;
                    ref: string;
                };
                jbgkmd0: {
                    id: string;
                    ref: string;
                };
                "6isum4q": {
                    id: string;
                    ref: string;
                };
                "8y1pfs1": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "885ujhf": {
                    id: string;
                    value: string;
                    ref: string;
                };
                "1rszkgx": {
                    id: string;
                    ref: string;
                };
                "38hmav3": {
                    id: string;
                    value: string;
                    ref: string;
                };
                mqnh6xj: {
                    id: string;
                    ref: string;
                };
                iok3jbv: {
                    id: string;
                    value: string;
                };
                "8r9yvc2": {
                    id: string;
                    value: string;
                    ref: string;
                };
                xetlgtj: {
                    id: string;
                    value: string;
                };
                l59vzq3: {
                    id: string;
                    ref: string;
                };
                "7zifjds": {
                    id: string;
                    value: string;
                    ref: string;
                };
                ewwqt0v: {
                    id: string;
                };
                xwql547: {
                    id: string;
                    value: string;
                    ref: string;
                };
                ld6qjwd: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "1ot7z1u": {
                    id: string;
                    value: string;
                    ref: string;
                };
                tqn91t0: {
                    id: string;
                    value: string;
                    ref: string;
                };
                seubbfl: {
                    id: string;
                    value: string;
                    ref: string;
                };
                vcji2y3: {
                    id: string;
                    ref: string;
                };
                y2eutqi: {
                    id: string;
                };
                sm6i8iw: {
                    id: string;
                    value: string;
                    ref: string;
                };
                pioqk5q: {
                    id: string;
                    value: string;
                    ref: string;
                };
                o9owpg5: {
                    id: string;
                    value: string;
                    ref: string;
                };
                u9t3cmw: {
                    id: string;
                    value: string;
                    ref: string;
                };
                hkaby14: {
                    id: string;
                    ref: string;
                };
                bpdeixu: {
                    id: string;
                    value: string;
                    ref: string;
                };
                iinolva: {
                    id: string;
                    value: string;
                    ref: string;
                };
                "0wjbxex": {
                    id: string;
                    value: string;
                };
                "6g2x5co": {
                    id: string;
                };
                iqxfxoq: {
                    id: string;
                    value: string;
                    ref: string;
                };
                yhuwqe9: {
                    id: string;
                    value: string;
                    ref: string;
                };
                m7aljc9: {
                    id: string;
                    value: string;
                    ref: string;
                };
                q72zw9n: {
                    id: string;
                    value: string;
                    ref: string;
                };
                j5hnwiu: {
                    id: string;
                    ref: string;
                };
                yleo130: {
                    id: string;
                    value: string;
                    ref: string;
                };
                u781r0g: {
                    id: string;
                    value: string;
                };
            };
            edges: {
                fhzn9j7: {
                    from: string;
                    to: string;
                    as: string;
                };
                jwib1ka: {
                    from: string;
                    to: string;
                    as: string;
                };
                hcp14pq: {
                    from: string;
                    to: string;
                    as: string;
                };
                avhgm5q: {
                    from: string;
                    to: string;
                    as: string;
                };
                "56bla57": {
                    from: string;
                    to: string;
                    as: string;
                };
                sd1ge10: {
                    from: string;
                    to: string;
                    as: string;
                };
                j7nk0p6: {
                    from: string;
                    to: string;
                    as: string;
                };
                "3mj0ula": {
                    from: string;
                    to: string;
                    as: string;
                };
                f9t73iw: {
                    from: string;
                    to: string;
                    as: string;
                };
                qgbinm2: {
                    from: string;
                    to: string;
                    as: string;
                };
                "8dy573e": {
                    from: string;
                    to: string;
                    as: string;
                };
                args: {
                    from: string;
                    to: string;
                    as: string;
                };
                hvkhebd: {
                    from: string;
                    to: string;
                    as: string;
                };
                yi2ezh0: {
                    from: string;
                    to: string;
                    as: string;
                };
                z6cwmqm: {
                    from: string;
                    to: string;
                    as: string;
                };
                kcvpnbr: {
                    from: string;
                    to: string;
                    as: string;
                };
                cjn10vv: {
                    from: string;
                    to: string;
                    as: string;
                };
                "8b808yt": {
                    from: string;
                    to: string;
                    as: string;
                };
                ky27m6w: {
                    from: string;
                    to: string;
                    as: string;
                };
                ntdapts: {
                    from: string;
                    to: string;
                    as: string;
                };
                i0ncdhp: {
                    from: string;
                    to: string;
                    as: string;
                };
                "202qikg": {
                    from: string;
                    to: string;
                    as: string;
                };
                itqudjx: {
                    from: string;
                    to: string;
                    as: string;
                };
                n12sjrc: {
                    from: string;
                    to: string;
                    as: string;
                };
                nnembhj: {
                    from: string;
                    to: string;
                    as: string;
                };
                lr9v8rm: {
                    from: string;
                    to: string;
                    as: string;
                };
                xfpzaer: {
                    from: string;
                    to: string;
                    as: string;
                };
                "32keuwb": {
                    from: string;
                    to: string;
                    as: string;
                };
                "7d5e83b": {
                    from: string;
                    to: string;
                    as: string;
                };
                "58h53vb": {
                    from: string;
                    to: string;
                    as: string;
                };
                "0omg02e": {
                    from: string;
                    to: string;
                    as: string;
                };
                tfv9ab6: {
                    from: string;
                    to: string;
                    as: string;
                };
                tjau54y: {
                    from: string;
                    to: string;
                    as: string;
                };
                z5v6iv9: {
                    from: string;
                    to: string;
                    as: string;
                };
                k2n6i8q: {
                    from: string;
                    to: string;
                    as: string;
                };
                hkbnt7q: {
                    from: string;
                    to: string;
                    as: string;
                };
                "9pd2wms": {
                    from: string;
                    to: string;
                    as: string;
                };
                "4ng68ah": {
                    from: string;
                    to: string;
                    as: string;
                };
                bpcb53a: {
                    from: string;
                    to: string;
                    as: string;
                };
                crz99st: {
                    from: string;
                    to: string;
                    as: string;
                };
                lokbjgu: {
                    from: string;
                    to: string;
                    as: string;
                };
                "5clo4vh": {
                    from: string;
                    to: string;
                    as: string;
                };
                rbqic4e: {
                    from: string;
                    to: string;
                    as: string;
                };
                bydhgr0: {
                    from: string;
                    to: string;
                    as: string;
                };
                v7zp3ck: {
                    from: string;
                    to: string;
                    as: string;
                };
                "2nk866r": {
                    from: string;
                    to: string;
                    as: string;
                };
                t4klpg0: {
                    from: string;
                    to: string;
                    as: string;
                };
                xgav7gf: {
                    from: string;
                    to: string;
                    as: string;
                };
                yzm2544: {
                    from: string;
                    to: string;
                    as: string;
                };
                boajzer: {
                    from: string;
                    to: string;
                    as: string;
                };
                fw4v0e8: {
                    from: string;
                    to: string;
                    as: string;
                };
                enwnlrg: {
                    from: string;
                    to: string;
                    as: string;
                };
                "3cn9gm5": {
                    from: string;
                    to: string;
                    as: string;
                };
                k81ohi2: {
                    from: string;
                    to: string;
                    as: string;
                };
                kce6b36: {
                    from: string;
                    to: string;
                    as: string;
                };
                "3bzpqfw": {
                    from: string;
                    to: string;
                    as: string;
                };
                "7re12iu": {
                    from: string;
                    to: string;
                    as: string;
                };
                "9asxtzl": {
                    from: string;
                    to: string;
                    as: string;
                };
                or2do3i: {
                    from: string;
                    to: string;
                    as: string;
                };
                d2m13om: {
                    from: string;
                    to: string;
                    as: string;
                };
                "5mrw162": {
                    from: string;
                    to: string;
                    as: string;
                };
                "9y1uozt": {
                    from: string;
                    to: string;
                    as: string;
                };
                lhm1ktw: {
                    from: string;
                    to: string;
                    as: string;
                };
                "152zzg7": {
                    from: string;
                    to: string;
                    as: string;
                };
                k780ign: {
                    from: string;
                    to: string;
                    as: string;
                };
                jbgkmd0: {
                    from: string;
                    to: string;
                    as: string;
                };
                "6isum4q": {
                    from: string;
                    to: string;
                    as: string;
                };
                "8y1pfs1": {
                    from: string;
                    to: string;
                    as: string;
                };
                "1rszkgx": {
                    from: string;
                    to: string;
                    as: string;
                };
                xetlgtj: {
                    from: string;
                    to: string;
                    as: string;
                };
                mqnh6xj: {
                    from: string;
                    to: string;
                    as: string;
                };
                "38hmav3": {
                    from: string;
                    to: string;
                    as: string;
                };
                "8r9yvc2": {
                    from: string;
                    to: string;
                    as: string;
                };
                iok3jbv: {
                    from: string;
                    to: string;
                    as: string;
                };
                "885ujhf": {
                    from: string;
                    to: string;
                    as: string;
                };
                l59vzq3: {
                    from: string;
                    to: string;
                    as: string;
                };
                "7zifjds": {
                    from: string;
                    to: string;
                    as: string;
                };
                tqn91t0: {
                    from: string;
                    to: string;
                    as: string;
                };
                "1ot7z1u": {
                    from: string;
                    to: string;
                    as: string;
                };
                ld6qjwd: {
                    from: string;
                    to: string;
                    as: string;
                };
                xwql547: {
                    from: string;
                    to: string;
                    as: string;
                };
                ewwqt0v: {
                    from: string;
                    to: string;
                    as: string;
                };
                seubbfl: {
                    from: string;
                    to: string;
                    as: string;
                };
                vcji2y3: {
                    from: string;
                    to: string;
                    as: string;
                };
                y2eutqi: {
                    from: string;
                    to: string;
                    as: string;
                };
                sm6i8iw: {
                    from: string;
                    to: string;
                    as: string;
                };
                pioqk5q: {
                    from: string;
                    to: string;
                    as: string;
                };
                o9owpg5: {
                    from: string;
                    to: string;
                    as: string;
                };
                hkaby14: {
                    from: string;
                    to: string;
                    as: string;
                };
                "0wjbxex": {
                    from: string;
                    to: string;
                    as: string;
                };
                iinolva: {
                    from: string;
                    to: string;
                    as: string;
                };
                bpdeixu: {
                    from: string;
                    to: string;
                    as: string;
                };
                u9t3cmw: {
                    from: string;
                    to: string;
                    as: string;
                };
                q72zw9n: {
                    from: string;
                    to: string;
                    as: string;
                };
                m7aljc9: {
                    from: string;
                    to: string;
                    as: string;
                };
                yhuwqe9: {
                    from: string;
                    to: string;
                    as: string;
                };
                iqxfxoq: {
                    from: string;
                    to: string;
                    as: string;
                };
                "6g2x5co": {
                    from: string;
                    to: string;
                    as: string;
                };
                j5hnwiu: {
                    from: string;
                    to: string;
                    as: string;
                };
                yleo130: {
                    from: string;
                    to: string;
                    as: string;
                };
                u781r0g: {
                    from: string;
                    to: string;
                    as: string;
                };
            };
        };
        "@math.noise": {
            edges: {
                "18ft0o0": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1es7qrh": {
                    as: string;
                    from: string;
                    to: string;
                };
                "2838i98": {
                    as: string;
                    from: string;
                    to: string;
                };
                "2zfxujb": {
                    as: string;
                    from: string;
                    to: string;
                };
                "3fqdnh3": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4qnsrir": {
                    as: string;
                    from: string;
                    to: string;
                };
                "5p3hf1e": {
                    as: string;
                    from: string;
                    to: string;
                };
                "5suk5mt": {
                    as: string;
                    from: string;
                    to: string;
                };
                "76mvyzz": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9dwbuh4": {
                    as: string;
                    from: string;
                    to: string;
                };
                c14vq1u: {
                    as: string;
                    from: string;
                    to: string;
                };
                caxm792: {
                    as: string;
                    from: string;
                    to: string;
                };
                d1mxhrc: {
                    as: string;
                    from: string;
                    to: string;
                };
                dl8tqbw: {
                    as: string;
                    from: string;
                    to: string;
                };
                gna5hrg: {
                    as: string;
                    from: string;
                    to: string;
                };
                i4vkq75: {
                    as: string;
                    from: string;
                    to: string;
                };
                iodmksr: {
                    as: string;
                    from: string;
                    to: string;
                };
                k4il51d: {
                    as: string;
                    from: string;
                    to: string;
                };
                l4denbs: {
                    as: string;
                    from: string;
                    to: string;
                };
                nzzp1an: {
                    as: string;
                    from: string;
                    to: string;
                };
                q6kbpnl: {
                    as: string;
                    from: string;
                    to: string;
                };
                qm6xfhw: {
                    as: string;
                    from: string;
                    to: string;
                };
                rcjsw21: {
                    as: string;
                    from: string;
                    to: string;
                };
                un9yhxm: {
                    as: string;
                    from: string;
                    to: string;
                };
                zxk2uuu: {
                    as: string;
                    from: string;
                    to: string;
                };
                zzpqc3t: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            name: string;
            nodes: {
                "18ft0o0": {
                    id: string;
                    ref: string;
                };
                "1es7qrh": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "2838i98": {
                    id: string;
                };
                "2zfxujb": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "3fqdnh3": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "4qnsrir": {
                    id: string;
                    ref: string;
                };
                "5p3hf1e": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "5suk5mt": {
                    id: string;
                    ref: string;
                };
                "76mvyzz": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "9dwbuh4": {
                    id: string;
                    ref: string;
                };
                c14vq1u: {
                    id: string;
                    ref: string;
                    value: string;
                };
                caxm792: {
                    id: string;
                    ref: string;
                };
                d1mxhrc: {
                    id: string;
                    ref: string;
                };
                dl8tqbw: {
                    id: string;
                    ref: string;
                    value: string;
                };
                gna5hrg: {
                    id: string;
                    ref: string;
                    value: string;
                };
                i4vkq75: {
                    id: string;
                    ref: string;
                    value: string;
                };
                iodmksr: {
                    id: string;
                    ref: string;
                };
                k4il51d: {
                    id: string;
                    ref: string;
                    value: string;
                };
                l4denbs: {
                    id: string;
                };
                nzzp1an: {
                    id: string;
                    ref: string;
                    value: string;
                };
                q6kbpnl: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qljoa2f: {
                    id: string;
                    name: string;
                    ref: string;
                };
                qm6xfhw: {
                    id: string;
                    ref: string;
                    value: string;
                };
                rcjsw21: {
                    id: string;
                    ref: string;
                    value: string;
                };
                un9yhxm: {
                    id: string;
                    ref: string;
                    value: string;
                };
                zxk2uuu: {
                    id: string;
                    ref: string;
                    value: string;
                };
                zzpqc3t: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
        };
        "@math.curlnoise": {
            edges: {
                "0f3yvkt": {
                    as: string;
                    from: string;
                    to: string;
                };
                "0wye9gb": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1dfm7ji": {
                    as: string;
                    from: string;
                    to: string;
                };
                "1qvyjit": {
                    as: string;
                    from: string;
                    to: string;
                };
                "3w2mjzs": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4rfdldl": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4y0zvwy": {
                    as: string;
                    from: string;
                    to: string;
                };
                "5iuypo6": {
                    as: string;
                    from: string;
                    to: string;
                };
                "7ddyvg5": {
                    as: string;
                    from: string;
                    to: string;
                };
                "7pazm63": {
                    as: string;
                    from: string;
                    to: string;
                };
                "9z5zasc": {
                    as: string;
                    from: string;
                    to: string;
                };
                args: {
                    as: string;
                    from: string;
                    to: string;
                };
                bp1jp8w: {
                    as: string;
                    from: string;
                    to: string;
                };
                coz46jt: {
                    as: string;
                    from: string;
                    to: string;
                };
                cy3xmxj: {
                    as: string;
                    from: string;
                    to: string;
                };
                dy65zb2: {
                    as: string;
                    from: string;
                    to: string;
                };
                gw4y5bs: {
                    as: string;
                    from: string;
                    to: string;
                };
                h5rpf0o: {
                    as: string;
                    from: string;
                    to: string;
                };
                kf6fscw: {
                    as: string;
                    from: string;
                    to: string;
                };
                nk91iof: {
                    as: string;
                    from: string;
                    to: string;
                };
                prsoiok: {
                    as: string;
                    from: string;
                    to: string;
                };
                r4iac0v: {
                    as: string;
                    from: string;
                    to: string;
                };
                ra9d520: {
                    as: string;
                    from: string;
                    to: string;
                };
                sal16lj: {
                    as: string;
                    from: string;
                    to: string;
                };
                tk5fa45: {
                    as: string;
                    from: string;
                    to: string;
                };
                tuw52lr: {
                    as: string;
                    from: string;
                    to: string;
                };
                v3ucnvc: {
                    as: string;
                    from: string;
                    to: string;
                };
                vktr3na: {
                    as: string;
                    from: string;
                    to: string;
                };
                wim2g5q: {
                    as: string;
                    from: string;
                    to: string;
                };
                xbort73: {
                    as: string;
                    from: string;
                    to: string;
                };
                xrxh9ci: {
                    as: string;
                    from: string;
                    to: string;
                };
                ywvf7t4: {
                    as: string;
                    from: string;
                    to: string;
                };
                zaqgks3: {
                    as: string;
                    from: string;
                    to: string;
                };
                zlojnd4: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            nodes: {
                "0f3yvkt": {
                    id: string;
                    value: string;
                };
                "0wye9gb": {
                    id: string;
                };
                "1dfm7ji": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "1qvyjit": {
                    id: string;
                    value: string;
                };
                "3w2mjzs": {
                    id: string;
                };
                "4rfdldl": {
                    id: string;
                    value: string;
                };
                "4y0zvwy": {
                    id: string;
                    ref: string;
                };
                "5iuypo6": {
                    id: string;
                    value: string;
                };
                "7ddyvg5": {
                    id: string;
                    ref: string;
                    value: string;
                };
                "7pazm63": {
                    id: string;
                    value: string;
                };
                "9z5zasc": {
                    id: string;
                    ref: string;
                    value: string;
                };
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                bp1jp8w: {
                    id: string;
                    ref: string;
                };
                coz46jt: {
                    id: string;
                    value: string;
                };
                cy3xmxj: {
                    id: string;
                    ref: string;
                };
                dy65zb2: {
                    id: string;
                    ref: string;
                };
                gw4y5bs: {
                    id: string;
                };
                h5rpf0o: {
                    id: string;
                    ref: string;
                };
                jnnnm7v: {
                    id: string;
                    value: string;
                };
                kf6fscw: {
                    id: string;
                };
                nk91iof: {
                    id: string;
                };
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                prsoiok: {
                    id: string;
                    ref: string;
                    value: string;
                };
                r4iac0v: {
                    id: string;
                    ref: string;
                };
                ra9d520: {
                    id: string;
                    ref: string;
                    value: string;
                };
                sal16lj: {
                    id: string;
                    ref: string;
                };
                tk5fa45: {
                    id: string;
                    ref: string;
                    value: string;
                };
                tuw52lr: {
                    id: string;
                    ref: string;
                    value: string;
                };
                v3ucnvc: {
                    id: string;
                    ref: string;
                    value: string;
                };
                vktr3na: {
                    id: string;
                    ref: string;
                    value: string;
                };
                wim2g5q: {
                    id: string;
                    ref: string;
                    value: string;
                };
                xbort73: {
                    id: string;
                    ref: string;
                };
                xrxh9ci: {
                    id: string;
                };
                ywvf7t4: {
                    id: string;
                    value: string;
                };
                zaqgks3: {
                    id: string;
                    ref: string;
                    value: string;
                };
                zlojnd4: {
                    id: string;
                };
            };
            out: string;
        };
        "@browser.writeClipboard": {
            edges: {
                output_val: {
                    as: string;
                    from: string;
                    to: string;
                };
                u9vcri1: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            nodes: {
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                output_val: {
                    id: string;
                    ref: string;
                    value: string;
                };
                u9vcri1: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
        };
        "@nodysseus.checkRefImportJSON": {
            edges: {
                akna0ig: {
                    as: string;
                    from: string;
                    to: string;
                };
                d6hbagr: {
                    as: string;
                    from: string;
                    to: string;
                };
                jmq5y9e: {
                    as: string;
                    from: string;
                    to: string;
                };
                ldk168m: {
                    as: string;
                    from: string;
                    to: string;
                };
                tmj66vh: {
                    as: string;
                    from: string;
                    to: string;
                };
                uzfo5bm: {
                    as: string;
                    from: string;
                    to: string;
                };
                va78wdx: {
                    as: string;
                    from: string;
                    to: string;
                };
                y5x546d: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            name: string;
            nodes: {
                akna0ig: {
                    id: string;
                    ref: string;
                    value: string;
                };
                d6hbagr: {
                    id: string;
                    ref: string;
                    value: string;
                };
                jmq5y9e: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ldk168m: {
                    id: string;
                    name: string;
                };
                r5emxzc: {
                    id: string;
                    name: string;
                    ref: string;
                };
                tmj66vh: {
                    id: string;
                    ref: string;
                };
                uzfo5bm: {
                    id: string;
                    ref: string;
                };
                va78wdx: {
                    id: string;
                    ref: string;
                    value: string;
                };
                y5x546d: {
                    id: string;
                    ref: string;
                    value: string;
                };
            };
            out: string;
        };
        "@nodysseus.graphDisplay": {
            category: string;
            edges: {
                "8dy573e": {
                    as: string;
                    from: string;
                    to: string;
                };
                args: {
                    as: string;
                    from: string;
                    to: string;
                };
                l0bwoyg: {
                    as: string;
                    from: string;
                    to: string;
                };
                wbxid6p: {
                    as: string;
                    from: string;
                    to: string;
                };
                ek4eavo: {
                    as: string;
                    from: string;
                    to: string;
                };
                mg9an48: {
                    as: string;
                    from: string;
                    to: string;
                };
                "4ugyo6z": {
                    as: string;
                    from: string;
                    to: string;
                };
                rpxj4ki: {
                    as: string;
                    from: string;
                    to: string;
                };
                "3g6ii4f": {
                    as: string;
                    from: string;
                    to: string;
                };
                h3b1zty: {
                    as: string;
                    from: string;
                    to: string;
                };
                "5312qb9": {
                    as: string;
                    from: string;
                    to: string;
                };
                "4apuf8v": {
                    as: string;
                    from: string;
                    to: string;
                };
                ckhbpn3: {
                    as: string;
                    from: string;
                    to: string;
                };
                dppeunw: {
                    as: string;
                    from: string;
                    to: string;
                };
                ockr8ja: {
                    as: string;
                    from: string;
                    to: string;
                };
                ycfa5m2: {
                    as: string;
                    from: string;
                    to: string;
                };
                yurq1hy: {
                    as: string;
                    from: string;
                    to: string;
                };
                kwybbgt: {
                    as: string;
                    from: string;
                    to: string;
                };
                tqc1zt5: {
                    as: string;
                    from: string;
                    to: string;
                };
                x73h5si: {
                    as: string;
                    from: string;
                    to: string;
                };
                qgbinm2: {
                    as: string;
                    from: string;
                    to: string;
                };
                "2f2neul": {
                    as: string;
                    from: string;
                    to: string;
                };
                r8rn59x: {
                    as: string;
                    from: string;
                    to: string;
                };
                k2dsx1d: {
                    as: string;
                    from: string;
                    to: string;
                };
                "1p5xpme": {
                    as: string;
                    from: string;
                    to: string;
                };
                "524n1fd": {
                    as: string;
                    from: string;
                    to: string;
                };
                fa0r6ra: {
                    as: string;
                    from: string;
                    to: string;
                };
                gnpriwi: {
                    as: string;
                    from: string;
                    to: string;
                };
                bgmmz4g: {
                    as: string;
                    from: string;
                    to: string;
                };
                "0vzo6wd": {
                    as: string;
                    from: string;
                    to: string;
                };
                rbaam2i: {
                    as: string;
                    from: string;
                    to: string;
                };
            };
            id: string;
            nodes: {
                out: {
                    id: string;
                    name: string;
                    ref: string;
                };
                args: {
                    id: string;
                    ref: string;
                    value: string;
                };
                l0bwoyg: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "8dy573e": {
                    id: string;
                    ref: string;
                };
                wbxid6p: {
                    id: string;
                    ref: string;
                };
                mg9an48: {
                    id: string;
                    ref: string;
                    value: string;
                };
                rpxj4ki: {
                    id: string;
                    ref: string;
                };
                h3b1zty: {
                    id: string;
                    ref: string;
                    value: string;
                };
                "3g6ii4f": {
                    id: string;
                };
                "5312qb9": {
                    id: string;
                };
                yurq1hy: {
                    id: string;
                    value: string;
                };
                ycfa5m2: {
                    id: string;
                    value: string;
                };
                ockr8ja: {
                    id: string;
                    value: string;
                };
                dppeunw: {
                    id: string;
                    value: string;
                };
                ckhbpn3: {
                    id: string;
                    value: string;
                };
                "4apuf8v": {
                    id: string;
                    value: string;
                };
                "4ugyo6z": {
                    id: string;
                    ref: string;
                    value: string;
                };
                kwybbgt: {
                    id: string;
                    ref: string;
                };
                x73h5si: {
                    id: string;
                    value: string;
                };
                tqc1zt5: {
                    id: string;
                    ref: string;
                    value: string;
                };
                qgbinm2: {
                    id: string;
                    ref: string;
                };
                r8rn59x: {
                    id: string;
                    value: string;
                };
                "2f2neul": {
                    id: string;
                    ref: string;
                    value: string;
                };
                k2dsx1d: {
                    id: string;
                    ref: string;
                    value: string;
                };
                ek4eavo: {
                    id: string;
                    ref: string;
                };
                "1p5xpme": {
                    id: string;
                };
                gnpriwi: {
                    id: string;
                };
                bgmmz4g: {
                    id: string;
                    value: string;
                };
                fa0r6ra: {
                    id: string;
                };
                "0vzo6wd": {
                    id: string;
                    value: string;
                };
                "524n1fd": {
                    id: string;
                };
                rbaam2i: {
                    id: string;
                    value: string;
                };
            };
            out: string;
        };
    };
    let edges: {};
}
