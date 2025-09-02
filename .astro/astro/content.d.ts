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
		"aboutUs": Record<string, {
  id: string;
  slug: string;
  body: string;
  collection: "aboutUs";
  data: InferEntrySchema<"aboutUs">;
  render(): Render[".md"];
}>;
"events": {
"2025-09-16-back-to-school-night.mdx": {
	id: "2025-09-16-back-to-school-night.mdx";
  slug: "2025-09-16-back-to-school-night";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
"2025-10-25-fall-harvest-festival.mdx": {
	id: "2025-10-25-fall-harvest-festival.mdx";
  slug: "2025-10-25-fall-harvest-festival";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".mdx"] };
};
"leadership": {
"co-president.mdx": {
	id: "co-president.mdx";
  slug: "co-president";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"jane-smith.mdx": {
	id: "jane-smith.mdx";
  slug: "jane-smith";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"john-doe.mdx": {
	id: "john-doe.mdx";
  slug: "john-doe";
  body: string;
  collection: "leadership";
  data: InferEntrySchema<"leadership">
} & { render(): Render[".mdx"] };
"peter-jones.mdx": {
	id: "peter-jones.mdx";
  slug: "peter-jones";
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
"about-us-history.mdx": {
	id: "about-us-history.mdx";
  slug: "about-us-history";
  body: string;
  collection: "pages";
  data: InferEntrySchema<"pages">
} & { render(): Render[".mdx"] };
"about-us.mdx": {
	id: "about-us.mdx";
  slug: "about-us";
  body: string;
  collection: "pages";
  data: InferEntrySchema<"pages">
} & { render(): Render[".mdx"] };
"impact.mdx": {
	id: "impact.mdx";
  slug: "impact";
  body: string;
  collection: "pages";
  data: InferEntrySchema<"pages">
} & { render(): Render[".mdx"] };
"our-vision.mdx": {
	id: "our-vision.mdx";
  slug: "our-vision";
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
  data: any
} & { render(): Render[".mdx"] };
"events-team.mdx": {
	id: "events-team.mdx";
  slug: "events-team";
  body: string;
  collection: "projects";
  data: any
} & { render(): Render[".mdx"] };
"fundraising-committee.mdx": {
	id: "fundraising-committee.mdx";
  slug: "fundraising-committee";
  body: string;
  collection: "projects";
  data: any
} & { render(): Render[".mdx"] };
"garden-club.mdx": {
	id: "garden-club.mdx";
  slug: "garden-club";
  body: string;
  collection: "projects";
  data: any
} & { render(): Render[".mdx"] };
"green-team.mdx": {
	id: "green-team.mdx";
  slug: "green-team";
  body: string;
  collection: "projects";
  data: any
} & { render(): Render[".mdx"] };
};
"transparency": Record<string, {
  id: string;
  slug: string;
  body: string;
  collection: "transparency";
  data: InferEntrySchema<"transparency">;
  render(): Render[".md"];
}>;
"volunteerOpportunities": {
"communications-team.md": {
	id: "communications-team.md";
  slug: "communications-team";
  body: string;
  collection: "volunteerOpportunities";
  data: InferEntrySchema<"volunteerOpportunities">
} & { render(): Render[".md"] };
"events-team.md": {
	id: "events-team.md";
  slug: "events-team";
  body: string;
  collection: "volunteerOpportunities";
  data: InferEntrySchema<"volunteerOpportunities">
} & { render(): Render[".md"] };
"fundraising-committee.md": {
	id: "fundraising-committee.md";
  slug: "fundraising-committee";
  body: string;
  collection: "volunteerOpportunities";
  data: InferEntrySchema<"volunteerOpportunities">
} & { render(): Render[".md"] };
"garden-club.md": {
	id: "garden-club.md";
  slug: "garden-club";
  body: string;
  collection: "volunteerOpportunities";
  data: InferEntrySchema<"volunteerOpportunities">
} & { render(): Render[".md"] };
"your-idea-here.md": {
	id: "your-idea-here.md";
  slug: "your-idea-here";
  body: string;
  collection: "volunteerOpportunities";
  data: InferEntrySchema<"volunteerOpportunities">
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

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
