# Example 1.2.4 Fetch ([Graph](https://nodysseus.ulysses.codes/#example_1_2_4))
Fetching a quote and outputting it as HTML.

<div align="center">
    <img src="https://gitlab.com/ulysses.codes/nodysseus/-/raw/main/docs/examples/images/1_2_4_graph.png" title="Example 1.2.4 CSS" />
</div>


## Graph breakdown

1. `display` is set up as usual([Example 1.2.2](https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/examples/1_2_2_html_children.md))
2. `get` returns the value specified by `path` from the `target`. The quotes API returns the quote text in `content`
3. `cache` caches the input `value` and returns the cached version whenever it is called. This ensures that the API is only called once.
4. `call` calls the function specified by `fn` on the object `self`. The quotes API returns JSON so we have to call [`json`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json)
5. `fetch` is a wrapper for the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch). Nodysseus automatically handles the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) result.
6. `url` is the url of the API