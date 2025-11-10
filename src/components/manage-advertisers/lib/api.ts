import { createClient } from "@supabase/supabase-js"
import { getAdvertisers, getPosts } from "@/components/manage-advertisers/lib/queries"

// Check if bypass mode is enabled
const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true"

// Create Supabase client only if not in bypass mode
const supabase = bypassAuth
	? null
	: createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
		)

export async function getInitialData() {
	// Return empty data in bypass mode
	if (bypassAuth || !supabase) {
		console.log("Bypass mode enabled - returning empty advertiser data")
		return {
			posts: [],
			advertisers: [],
		}
	}

	const [postsResult, advertisersResult] = await Promise.all([
		getPosts(supabase),
		getAdvertisers(supabase),
	])

	if (postsResult.error || advertisersResult.error) {
		console.error(postsResult.error || advertisersResult.error)
		throw new Error("Error fetching data from Supabase")
	}

	return {
		posts:
			postsResult.data?.map((post) => ({
				id: post.id,
				postId: post.postId,
				title: post.title,
				productHandle: post.productHandle,
				productName: post.productName,
				advertiser_name: (post.advertisers as unknown as { name: string })?.name || "",
			})) || [],
		advertisers: advertisersResult.data || [],
	}
}
