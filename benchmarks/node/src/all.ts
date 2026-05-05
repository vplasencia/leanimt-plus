async function run() {
    await import("./insert")
    await import("./generate-membership")
    await import("./verify-membership")
    await import("./generate-non-membership")
    await import("./verify-non-membership")
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})
