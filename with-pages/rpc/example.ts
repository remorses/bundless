export default async function example(arg: { echo: string }) {
    return { echo: arg.echo || 'nothing to be said...' }
}
