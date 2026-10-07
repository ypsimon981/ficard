-- Owner-only dashboard queries; do not grant public SELECT access.
-- These count consenting browser/app installations, not Play downloads.
select date_trunc('day',received_at) as day,
       count(distinct installation_id) as active_installations,
       count(*) filter(where event='app_open') as app_opens
from public.ficard_usage_events
where received_at >= now()-interval '30 days'
group by 1 order by 1 desc;

select page,count(*) as views
from public.ficard_usage_events
where event='page_view' and received_at>=now()-interval '30 days'
group by page order by views desc;

select coalesce(brand,'custom') as brand,count(*) as cards_added
from public.ficard_usage_events
where event='card_added' and received_at>=now()-interval '30 days'
group by brand order by cards_added desc;
