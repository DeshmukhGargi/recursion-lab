#ifndef RECURSION_H
#define RECURSION_H
/* Event types the C code sends to JavaScript */
enum { EV_CALL = 0, EV_PUSH = 1, EV_BASE = 2, EV_RETURN = 3, EV_POP = 4 };
#define MAX_EVENTS 4096
/* 7 ints per event, so JavaScript can read it straight from WebAssembly memory */
typedef struct { int type, id, parent, depth, n, value, line; } Event;
void ev_reset(void);
int  ev_new_id(void);
void ev_emit(int type, int id, int parent, int depth, int n, int value, int line);
Event* get_events(void);
int  get_event_count(void);
int  run_factorial(int n);
int  run_fibonacci(int n);
#endif
