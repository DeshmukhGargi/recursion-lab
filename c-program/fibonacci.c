#include <emscripten.h>
#include "recursion.h"
/* Real recursive Fibonacci (two recursive calls per non-base call). */
static int fib(int n, int parent, int depth) {
    int id = ev_new_id(), r;
    ev_emit(EV_CALL, id, parent, depth, n, 0, 0);
    ev_emit(EV_PUSH, id, parent, depth, n, 0, 0);
    if (n <= 1) { ev_emit(EV_BASE, id, parent, depth, n, n, 2); r = n; }
    else        { r = fib(n - 1, id, depth + 1) + fib(n - 2, id, depth + 1); }
    ev_emit(EV_RETURN, id, parent, depth, n, r, n <= 1 ? 2 : 3);
    ev_emit(EV_POP,    id, parent, depth, n, r, 4);
    return r;
}
EMSCRIPTEN_KEEPALIVE int run_fibonacci(int n) { ev_reset(); fib(n, -1, 0); return get_event_count(); }
