declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"aboutUs": {
"about-us.mdx": {
	id: "about-us.mdx";
  slug: "about-us";
  body: string;
  collection: "aboutUs";
  data: InferEntrySchema<"aboutUs">
} & { render(): Render[".mdx"] };
};
"events": {
"2025-09-09-how-to-raise-a-healthy-gamer.mdx": {
	id: "2025-09-09-how-to-raise-a-healthy-gamer.mdx";
  slug: "2025-09-09-how-to-raise-a-healthy-gamer";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2025-09-10-ecopto-monthly-meeting.mdx": {
	id: "2025-09-10-ecopto-monthly-meeting.mdx";
  slug: "2025-09-10-ecopto-monthly-meeting";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2025-09-16-back-to-school-night.mdx": {
	id: "2025-09-16-back-to-school-night.mdx";
  slug: "2025-09-16-back-to-school-night";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2026-01-03-native-seed-sowing-extravaganza.mdx": {
	id: "2026-01-03-native-seed-sowing-extravaganza.mdx";
  slug: "2026-01-03-native-seed-sowing-extravaganza";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2026-01-03-webinar-build-your-best-native-garden.mdx": {
	id: "2026-01-03-webinar-build-your-best-native-garden.mdx";
  slug: "2026-01-03-webinar-build-your-best-native-garden";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2026-01-24-ecopto-monthly-meeting.mdx": {
	id: "2026-01-24-ecopto-monthly-meeting.mdx";
  slug: "2026-01-24-ecopto-monthly-meeting";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2026-03-07-hvrsd-ecopto-potluck.mdx": {
	id: "2026-03-07-hvrsd-ecopto-potluck.mdx";
  slug: "2026-03-07-hvrsd-ecopto-potluck";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2026-03-15-family-hike.mdx": {
	id: "2026-03-15-family-hike.mdx";
  slug: "2026-03-15-family-hike";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2026-03-18-call-for-volunteers.mdx": {
	id: "2026-03-18-call-for-volunteers.mdx";
  slug: "2026-03-18-call-for-volunteers";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
};
"get-involved": {
"communications-team.md": {
	id: "communications-team.md";
  slug: "communications-team";
  body: string;
  collection: "get-involved";
  data: any
} & { render(): Render[".md"] };
"events-team.md": {
	id: "events-team.md";
  slug: "events-team";
  body: string;
  collection: "get-involved";
  data: any
} & { render(): Render[".md"] };
"garden-club.md": {
	id: "garden-club.md";
  slug: "garden-club";
  body: string;
  collection: "get-involved";
  data: any
} & { render(): Render[".md"] };
"outdoor-learning-consultant.md": {
	id: "outdoor-learning-consultant.md";
  slug: "outdoor-learning-consultant";
  body: string;
  collection: "get-involved";
  data: any
} & { render(): Render[".md"] };
"research-lead.md": {
	id: "research-lead.md";
  slug: "research-lead";
  body: string;
  collection: "get-involved";
  data: any
} & { render(): Render[".md"] };
"your-idea-here.md": {
	id: "your-idea-here.md";
  slug: "your-idea-here";
  body: string;
  collection: "get-involved";
  data: any
} & { render(): Render[".md"] };
};
"getInvolved": Record<string, {
  id: string;
  slug: string;
  body: string;
  collection: "getInvolved";
  data: InferEntrySchema<"getInvolved">;
  render(): Render[".md"];
}>;
"leadership": {
"co-president.mdx": {
	id: "co-president.mdx";
  slug: "co-president";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"co-treasurer.mdx": {
	id: "co-treasurer.mdx";
  slug: "co-treasurer";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"julie-cesari.mdx": {
	id: "julie-cesari.mdx";
  slug: "julie-cesari";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"kristin-broderick.mdx": {
	id: "kristin-broderick.mdx";
  slug: "kristin-broderick";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"marian-lobos.mdx": {
	id: "marian-lobos.mdx";
  slug: "marian-lobos";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"monica-carlson.mdx": {
	id: "monica-carlson.mdx";
  slug: "monica-carlson";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
};
"news": {
"2025-08-07-welcome-from-the-ecoPTO-president.mdx": {
	id: "2025-08-07-welcome-from-the-ecoPTO-president.mdx";
  slug: "2025-08-07-welcome-from-the-ecopto-president";
  body: string;
  collection: "news";
  data: InferEntrySchema<"news">
} & { render(): Render[".mdx"] };
};
"pages": {
"impact.mdx": {
	id: "impact.mdx";
  slug: "impact";
  body: string;
  collection: "pages";
  data: InferEntrySchema<"pages">
} & { render(): Render[".mdx"] };
};
"projects": {
"communications-team.mdx": {
	id: "communications-team.mdx";
  slug: "communications-team";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"events-team.mdx": {
	id: "events-team.mdx";
  slug: "events-team";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"fundraising-committee.mdx": {
	id: "fundraising-committee.mdx";
  slug: "fundraising-committee";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"garden-club.mdx": {
	id: "garden-club.mdx";
  slug: "garden-club";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
"green-team.mdx": {
	id: "green-team.mdx";
  slug: "green-team";
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">
} & { render(): Render[".mdx"] };
};
"research": {
"research.mdx": {
	id: "research.mdx";
  slug: "research";
  body: string;
  collection: "research";
  data: InferEntrySchema<"research">
} & { render(): Render[".mdx"] };
};
"transparency": {
"placeholder.md": {
	id: "placeholder.md";
  slug: "placeholder";
  body: string;
  collection: "transparency";
  data: InferEntrySchema<"transparency">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		"homepage": {
"home": {
	id: "home";
  collection: "homepage";
  data: InferEntrySchema<"homepage">
};
};
"settings": {
"global": {
	id: "global";
  collection: "settings";
  data: InferEntrySchema<"settings">
};
};
"signup": {
"signup": {
	id: "signup";
  collection: "signup";
  data: any
};
};

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
