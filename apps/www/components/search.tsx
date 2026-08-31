"use client";

import { Loading03Icon, Search02Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Doc } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import { OpportunityPathway, WorkMode } from "@repo/domain/opportunity";
import { makePlaceScope } from "@repo/domain/place";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { Effect, Option, Schema } from "effect";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Filters, type FilterValue } from "@/components/filters";
import { Results } from "@/components/results";
import { SearchHistory } from "@/components/search-history";
import { countryCodeFromName } from "@/lib/geography";

const OptionalPathway = Schema.Union([OpportunityPathway, Schema.Literal("")]);
const OptionalWorkMode = Schema.Union([WorkMode, Schema.Literal("")]);
const SearchFormState = Schema.Struct({
  city: Schema.String,
  country: Schema.String,
  countryCode: Schema.String,
  pathway: OptionalPathway,
  query: Schema.String,
  region: Schema.String,
  regionCode: Schema.String,
  workMode: OptionalWorkMode,
});
const searchFormSchema = Schema.toStandardSchemaV1(SearchFormState);
type SearchFormValues = Schema.Schema.Type<typeof SearchFormState>;

type SearchWorkspaceProps = Readonly<{
  profile: Doc<"profiles"> | null;
}>;

/** Compares the submitted search snapshot with the editable form criteria. */
function sameSearchCriteria(
  current: SearchFormValues,
  submitted: SearchFormValues
) {
  return (
    current.city === submitted.city &&
    current.country === submitted.country &&
    current.countryCode === submitted.countryCode &&
    current.pathway === submitted.pathway &&
    current.query.trim() === submitted.query.trim() &&
    current.region === submitted.region &&
    current.regionCode === submitted.regionCode &&
    current.workMode === submitted.workMode
  );
}

/** Restores one durable search session into editable form values. */
function sessionSearchValues(
  session: Doc<"searches"> | null | undefined,
  locale: string
): SearchFormValues | null {
  if (!session) {
    return null;
  }
  return {
    city: session.city ?? "",
    country: session.country ?? "",
    countryCode:
      session.countryCode ??
      countryCodeFromName(session.country ?? "", locale) ??
      "",
    pathway: session.pathway ?? "",
    query: session.query,
    region: session.region ?? "",
    regionCode: session.regionCode ?? "",
    workMode: session.workMode ?? "",
  };
}

/** Projects saved profile preferences into initial search values. */
function profileSearchValues(profile: Doc<"profiles"> | null, locale: string) {
  const country = profile?.desiredLocations[0] ?? "";
  return {
    city: "",
    country,
    countryCode: countryCodeFromName(country, locale) ?? "",
    pathway: profile?.pathways[0] ?? "",
    query: profile?.desiredRoles[0] ?? "",
    region: "",
    regionCode: "",
    workMode: profile?.workModes[0] ?? "",
  } satisfies SearchFormValues;
}

/** Renders the hydrated search workspace after profile defaults are known. */
function SearchWorkspace({ profile }: SearchWorkspaceProps) {
  const t = useTranslations("search");
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeKey = searchParams.get("search");
  const startSearch = useMutation(api.opportunities.start);
  const latest = useQuery(api.searchhistory.latest);
  const selected = useQuery(
    api.searchhistory.byKey,
    routeKey ? { searchKey: routeKey } : "skip"
  );
  const session = routeKey
    ? (selected ?? (latest?._id === routeKey ? latest : undefined))
    : latest;
  const searchId = session?._id;
  const opportunities = useQuery(
    api.opportunities.list,
    searchId ? { searchId } : "skip"
  );
  const sessionLoading = routeKey
    ? selected === undefined
    : latest === undefined;
  const running = session?.status === "running";
  const sessionValues = sessionSearchValues(session, locale);
  const profileValues = profileSearchValues(profile, locale);

  const form = useForm({
    defaultValues: sessionValues ?? profileValues,
    formId: searchId ?? "profile-search",
    onSubmit: async ({ value }) => {
      const placeOption = await Effect.runPromise(
        makePlaceScope(value).pipe(Effect.option)
      );
      if (Option.isNone(placeOption)) {
        toast.error(t("invalidPlace"));
        return;
      }
      const place = placeOption.value;
      const query = value.query.trim();
      if (!(query || place || value.pathway || value.workMode)) {
        toast.error(t("missing"));
        return;
      }

      const started = await startSearch({
        locale,
        ...(value.pathway ? { pathway: value.pathway } : {}),
        ...(place ? { place } : {}),
        query,
        ...(value.workMode ? { workMode: value.workMode } : {}),
      }).then(
        (result) => result,
        () => null
      );
      if (!started) {
        toast.error(common("error"));
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", started.searchId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    validators: {
      onChange: searchFormSchema,
      onSubmit: searchFormSchema,
    },
  });

  /** Synchronizes one committed filter value into the TanStack form. */
  function changeFilters(filters: FilterValue) {
    form.setFieldValue("city", filters.city);
    form.setFieldValue("country", filters.country);
    form.setFieldValue("countryCode", filters.countryCode);
    form.setFieldValue("pathway", filters.pathway);
    form.setFieldValue("region", filters.region);
    form.setFieldValue("regionCode", filters.regionCode);
    form.setFieldValue("workMode", filters.workMode);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="z-10 shrink-0 border-b bg-background">
        <div className="mx-auto w-full max-w-[90rem] px-4 py-3 sm:px-6">
          <h1 className="sr-only">{t("title")}</h1>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <form.Field name="query">
                {(field) => (
                  <Input
                    className="flex-1 text-sm sm:min-w-0"
                    maxLength={400}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder={t("placeholder")}
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    className="shrink-0"
                    disabled={!canSubmit || isSubmitting}
                    type="submit"
                  >
                    <HugeIcons
                      className={
                        isSubmitting ? "size-4 animate-spin" : "size-4"
                      }
                      icon={isSubmitting ? Loading03Icon : Search02Icon}
                    />
                    {isSubmitting ? t("starting") : t("button")}
                  </Button>
                )}
              </form.Subscribe>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <form.Subscribe
                selector={(state) => ({
                  city: state.values.city,
                  country: state.values.country,
                  countryCode: state.values.countryCode,
                  pathway: state.values.pathway,
                  region: state.values.region,
                  regionCode: state.values.regionCode,
                  workMode: state.values.workMode,
                })}
              >
                {(filters) => (
                  <Filters
                    disabled={false}
                    onChange={changeFilters}
                    value={filters}
                  />
                )}
              </form.Subscribe>
              <SearchHistory activeSearchId={searchId} />
              <form.Subscribe
                selector={(state) =>
                  sessionValues !== null &&
                  !sameSearchCriteria(state.values, sessionValues)
                }
              >
                {(criteriaChanged) =>
                  criteriaChanged ? (
                    <span className="text-muted-foreground text-sm">
                      {t("criteriaChanged")}
                    </span>
                  ) : null
                }
              </form.Subscribe>
              {running ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                  <span className="size-2 animate-pulse rounded-full bg-primary" />
                  {session.stage === "expansion"
                    ? t("expandingResults")
                    : t("streamingResults")}
                </span>
              ) : null}
              {session?.outcome === "partial" ? (
                <span className="text-muted-foreground text-sm">
                  {session.limitation === "source_capacity"
                    ? t("partialCapacity", {
                        count: session.resultCount ?? 0,
                      })
                    : t("partialResults", {
                        count: session.resultCount ?? 0,
                      })}
                </span>
              ) : null}
            </div>
          </form>
        </div>
      </header>

      <div
        aria-live="polite"
        className="mx-auto flex min-h-0 w-full min-w-0 max-w-[90rem] flex-1 px-4 py-4 sm:px-6"
      >
        <Results
          failed={session?.status === "failed"}
          key={searchId ?? "latest"}
          loading={
            sessionLoading || (Boolean(searchId) && opportunities === undefined)
          }
          records={opportunities ?? []}
          running={running}
          sourceCapacityReached={session?.limitation === "source_capacity"}
        />
      </div>
    </section>
  );
}

/** Resolves profile defaults before mounting the controlled search form. */
export function Search() {
  const profile = useQuery(api.profiles.get);
  if (profile === undefined) {
    return <SearchWorkspace profile={null} />;
  }
  return (
    <SearchWorkspace
      key={`${profile?._id ?? "new"}-${profile?.updatedAt ?? 0}`}
      profile={profile}
    />
  );
}
