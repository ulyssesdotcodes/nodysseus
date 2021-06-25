
      const node = state.graph.nodes[name];
      const stack = state.graph.edges.filter(c => c[0] === name).map(c => c[1]); 

      state.temp.results.set(name, input);

			const log_node = "";

      while(stack.length > 0) { 
        const run = stack.pop(); 
        if(!state.graph.nodes.hasOwnProperty(run)) {
          throw new Error("Unknown node " + run)
        }
        const run_node = {...state.graph.nodes[run]};
        while(run_node.type && run_node.type !== 'script'){
          if(!state.graph.defaults.hasOwnProperty(run_node.type)) {
            throw new Error("Unknown node type " + run_node.type + " on node " + run);
          }
          run_node.nodes = {...state.graph.defaults[run_node.type].nodes, ...run_node.nodes};
          run_node.type = state.graph.defaults[run_node.type].type;
        }

        const input = Object.fromEntries(
					state.graph.edges
						.filter(c => c[1] === run)
						.map(c => [c[2], state.temp.results.get(c[0])])
				);

				if(log_node === run){
					console.log("start " + run + " with input ");
					console.dir(input);
				}

        await Promise.resolve(run_node)
          .then(node => new AsyncFunction('state', 'name', 'input', node.nodes.script)(state, run, input))
          .then(result => {
            state.temp.errors.delete(run);
            if(result !== undefined) {  
              state.temp.results.set(run, result); 
              state.graph.edges.filter(c => c[0] === run).forEach(c => stack.unshift(c[1])); 
            }

						if(log_node === run){
							console.log("end" + run + " with ");
							console.dir(result);
						}

          })
          .catch(err => { console.log(`error running ${run}`); console.error(err); state.temp.errors.set(run, err); });
      }
    