function extractProductInfo(data: any) {
	try {
		// Navigate through the nested structure to find productInfo
		if (Array.isArray(data)) {
			for (const item of data) {
				if (item && typeof item === 'object') {
					if (item.loaderData && item.loaderData['(name$)/(id)/page'] && item.loaderData['(name$)/(id)/page'].initialData) {
						return item.loaderData['(name$)/(id)/page'].initialData.productInfo;
					}
				}
			}
		}
		
		// If direct structure access doesn't work, try to find productInfo recursively
		const findProductInfo = (obj: any): any => {
			if (obj && typeof obj === 'object') {
				if (obj.productInfo) {
					return obj.productInfo;
				}
				for (const key in obj) {
					if (obj.hasOwnProperty(key)) {
						const result = findProductInfo(obj[key]);
						if (result) return result;
					}
				}
			}
			return null;
		};
		
		return findProductInfo(data);
	} catch (error) {
		console.error('Error extracting productInfo:', error);
		return null;
	}
}

async function fetchProductData(productId: string, region: string = 'VN', locale: string = 'vi') {
	// First try the SSR endpoint for structured data
	const ssrUrl = `https://shop.tiktok.com/view/product/${productId}?__loader=(shop$)/(pdp)/(name$)/(id)/page&__ssrDirect=true`;
	
	// Main product page URL with region and locale
	const productUrl = `https://shop.tiktok.com/view/product/${productId}?region=${region}&local=en`;

	const headers = {
		'accept': 'application/json',
		'accept-language': 'vi,en;q=0.9,en-US;q=0.8,en-AU;q=0.7,en-CA;q=0.6',
		'cache-control': 'max-age=0',
		'priority': 'u=0, i',
		'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"macOS"',
		'sec-fetch-mode': 'navigate',
		'sec-fetch-site': 'none',
		'sec-fetch-user': '?1',
		'upgrade-insecure-requests': '1',
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
		'Cookie': '__ac_referer=__ac_blank; tt_chain_token=gvQuk4TfY5OJQ4WEvF9+NQ==; from_way=paid; tta_attr_id_mirror=0.1741683312.7480472862911004689; _ga=GA1.1.814656368.1741683315; FPID=FPID2.2.NpfvKo32zBiAmR6Qrw7dYDINCd%2Bw8uDiRHBMg2krKXo%3D.1741683315; _fbp=fb.1.1741683315294.1936678714; _yjsu_yjad=1741683315.2bac27b5-7e13-41bd-8724-fbe8c26d5a96; _tt_enable_cookie=1; _gtmeec=e30%3D; tt_ticket_guard_client_web_domain=2; _tt_ticket_crypt_doamin=3; __security_server_data_status=1; i18next=en; uid_tt=820bf705e47724161508e8a3289769b160101841c00cac96a93a0be5bef794ab; uid_tt_ss=820bf705e47724161508e8a3289769b160101841c00cac96a93a0be5bef794ab; sid_tt=5a081eae97f188b47001842f7759fd5d; sessionid=5a081eae97f188b47001842f7759fd5d; sessionid_ss=5a081eae97f188b47001842f7759fd5d; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg',
		'referer': 'https://shop.tiktok.com'
	};

	try {
		// Try SSR endpoint first for structured data
		const ssrResponse = await fetch(ssrUrl, {
			method: "GET",
			headers: headers,
		});

		if (ssrResponse.ok) {
			const ssrData = await ssrResponse.text();
			try {
				const jsonData = JSON.parse(ssrData);
				if (jsonData && Object.keys(jsonData).length > 0) {
					// Extract productInfo from the complex nested structure
					const productInfo = extractProductInfo(jsonData);
					return {
						success: true,
						data: productInfo,
						source: 'ssr'
					};
				}
			} catch (e) {
				console.log('SSR data is not JSON, trying main page...');
			}
		}

		// Fallback to main product page
		const response = await fetch(productUrl, {
			method: "GET",
			headers: headers,
		});

		if (response.ok) {
			const htmlData = await response.text();
			
			// Extract JSON data from HTML using regex
			const scriptMatches = htmlData.match(/<script[^>]*>window\.__INITIAL_STATE__\s*=\s*({.*?})\s*<\/script>/);
			if (scriptMatches && scriptMatches[1]) {
				try {
					const initialState = JSON.parse(scriptMatches[1]);
					const productInfo = extractProductInfo(initialState);
					return {
						success: true,
						data: productInfo,
						source: 'html_extract'
					};
				} catch (e) {
					console.error('Failed to parse initial state:', e);
				}
			}

			// Look for other potential JSON data
			const jsonRegex = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
			const jsonMatches = [];
			let match;
			while ((match = jsonRegex.exec(htmlData)) !== null) {
				jsonMatches.push(match[1]);
			}
			
			if (jsonMatches.length > 0) {
				const allJsonData = jsonMatches.map(jsonContent => {
					try {
						return JSON.parse(jsonContent);
					} catch (e) {
						return null;
					}
				}).filter(data => data !== null);

				if (allJsonData.length > 0) {
					// Try to extract productInfo from each JSON data
					for (const jsonData of allJsonData) {
						const productInfo = extractProductInfo(jsonData);
						if (productInfo) {
							return {
								success: true,
								data: productInfo,
								source: 'json_scripts'
							};
						}
					}
					// If no productInfo found, return the first available data
					return {
						success: true,
						data: allJsonData[0],
						source: 'json_scripts'
					};
				}
			}

			// If no structured data found, return basic HTML info
			const titleMatch = htmlData.match(/<title[^>]*>(.*?)<\/title>/i);
			const title = titleMatch ? titleMatch[1] : 'Unknown Product';

			return {
				success: true,
				data: {
					title: title,
					productId: productId,
					region: region,
					locale: locale,
					rawHtml: htmlData.substring(0, 1000) + '...' // First 1000 chars for debugging
				},
				source: 'html_basic'
			};
		} else {
			console.error(`Request failed with status: ${response.status}`);
			return {
				success: false,
				error: `HTTP ${response.status}`,
				message: 'Failed to fetch product data'
			};
		}
	} catch (error) {
		console.error("Error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Network or parsing error occurred'
		};
	}
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { searchParams } = new URL(request.url);
	const region = searchParams.get('region') || 'VN';
	const locale = searchParams.get('locale') || 'vi';

	const result = await fetchProductData(id, region, locale);
	
	return Response.json({
		productId: id,
		region: region,
		locale: locale,
		...result
	});
}
