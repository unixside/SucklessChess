import { serve } from "bun";

const ImgRegExp = new RegExp("/*.png");

serve({
	port: 3000,
	async fetch(request) {
		const url = new URL(request.url);
		const pathname = url.pathname;

		if (pathname === "/" || pathname === "/index.html") {
			return new Response(Bun.file("./index.html"));
		}

		if (pathname === "/style.css") {
			return new Response(Bun.file("./style.css"), {
				headers: { "Content-Type": "text/css" },
			});
		}

		if (pathname === "/script.js" || pathname === "./script.js") {
			return new Response(Bun.file("./dist/index.js"), {
				headers: { "Content-Type": "application/javascript" },
			});
		}

		if (ImgRegExp.test(pathname)) {
			return new Response(Bun.file(`./${pathname}`));
		}

		return new Response("Not found", { status: 404 });
	},
});

console.log("Server running at http://localhost:3000");
