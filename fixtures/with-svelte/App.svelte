<script lang="typescript">
    let count: number = 0
    let increment = () => count++
    let decrement = () => count--
</script>

<div>counts: {count}</div>
<button on:click={increment}>increment</button>
<button on:click={decrement}>decrement</button>

<style>
    div {
        background-color: red;
    }
</style>
