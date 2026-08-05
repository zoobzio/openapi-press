/**
 * The brand marking operation descriptors. A binder walking a namespace tree
 * needs it to tell descriptor leaves from namespace branches — both are plain
 * objects, so structure alone cannot tell them apart.
 */

export const OP_BRAND: unique symbol = Symbol("openapi-press.op");
