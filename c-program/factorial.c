#include <emscripten.h>
#include "recursion.h"
/* Real recursive factorial. Every call, base case and return is reported as an event. */
static int fact(int n, int parent, int depth) {
    int id = ev_new_id(), r;
    ev_emit(EV_CALL, id, parent, depth, n, 0, 0);
    ev_emit(EV_PUSH, id, parent, depth, n, 0, 0);
    if (n <= 1) { ev_emit(EV_BASE, id, parent, depth, n, 1, 2); r = 1; }
    else        { r = n * fact(n - 1, id, depth + 1); }
    ev_emit(EV_RETURN, id, parent, depth, n, r, n <= 1 ? 2 : 3);
    ev_emit(EV_POP,    id, parent, depth, n, r, 4);
    return r;
}
EMSCRIPTEN_KEEPALIVE int run_factorial(int n) { ev_reset(); fact(n, -1, 0); return get_event_count(); }
