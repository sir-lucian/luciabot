import { extractUserId } from '@twurple/common';
/** @internal */
export function createClipCreateQuery(channel, createAfterDelay) {
    return {
        broadcaster_id: extractUserId(channel),
        has_delay: createAfterDelay.toString()
    };
}
/** @internal */
export function createClipQuery(params) {
    const { filterType, ids, startDate, endDate } = params;
    return {
        [filterType]: ids,
        started_at: startDate,
        ended_at: endDate
    };
}
