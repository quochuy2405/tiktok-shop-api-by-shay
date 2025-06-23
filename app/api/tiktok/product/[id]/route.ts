export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { searchParams } = new URL(request.url);
	const region = searchParams.get("region") || "VN";
	const locale = searchParams.get("locale") || "vi";

	const result = await fetch(
		`https://shop-vn.tiktok.com/pdp/${id}?source=homepage_h5&__ssrDirect=true&__loader=(name$)/(id)/page`,
		{
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
			},
		}
	);

  const html = await result.text();
  const json = JSON.parse(html);
	
	return Response.json(json);
}
