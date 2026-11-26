#include <emscripten.h>
#include "recursion.h"
static Event buf[MAX_EVENTS];
static int count = 0, next_id = 0;
void ev_reset(void) { count = 0; next_id = 0; }
int  ev_new_id(void) { return next_id++; }
void ev_emit(int type, int id, int parent, int depth, int n, int value, int line) {
    if (count < MAX_EVENTS) { Event e = { type, id, parent, depth, n, value, line }; buf[count++] = e; }
}
EMSCRIPTEN_KEEPALIVE Event* get_events(void) { return buf; }
EMSCRIPTEN_KEEPALIVE int get_event_count(void) { return count; }
