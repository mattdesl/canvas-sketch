export default function defined() {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] != null) {
      return arguments[i];
    }
  }
  return undefined;
}
