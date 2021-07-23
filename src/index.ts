import { initialize } from "./app";

const start = async() => {
    const app = await initialize();
    const PORT = process.env.PORT || 8056;
    app.listen(PORT, () => {
        console.log(`\n🚀!! server started on http://localhost:${PORT} !!`)
    })
}
start().catch(err => console.log(err));