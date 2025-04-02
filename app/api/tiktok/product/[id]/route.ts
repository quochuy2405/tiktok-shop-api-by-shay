async function fetchProductData(productId: string) {
	const url = `https://shop.tiktok.com/view/product/${productId}?__loader=(shop$)/(pdp)/(name$)/(id)/page&__ssrDirect=true`;

	const headers = {
		referer: "https://shop.tiktok.com",
		"user-agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
	};
	try {
		const response = await fetch(url, {
			method: "GET",
			headers: headers,
		});
		if (response.ok) {
			const data = await response.text(); // Nhận dữ liệu dưới dạng text (HTML)
			return JSON.parse(data);
		} else {
			console.error(`Request failed with status: ${response.status}`);
			return null;
		}
	} catch (error) {
		console.error("Error:", error);
		return null;
	}
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const data: any = await fetchProductData(id);
	return Response.json({ data });
}
