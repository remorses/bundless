import {text} from "/text.ts?namespace=file&t=0";
function jsx(t, p, children) {
  var node = document.createElement(t);
  var textNode = document.createTextNode(children || p.children);
  node.appendChild(textNode);
  document.body.appendChild(node);
}
let x = /* @__PURE__ */ jsx("div", null, text);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tb3JzZS9Eb2N1bWVudHMvR2l0SHViL2VzcGFjay9maXh0dXJlcy93aXRoLXRzeC9tYWluLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAanN4IGpzeFxuaW1wb3J0IHsgdGV4dCB9IGZyb20gJy4vdGV4dCdcblxuZnVuY3Rpb24ganN4KHQsIHAsIGNoaWxkcmVuKSB7XG4gICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHQpXG4gICAgdmFyIHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY2hpbGRyZW4gfHwgcC5jaGlsZHJlbilcbiAgICBub2RlLmFwcGVuZENoaWxkKHRleHROb2RlKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSlcbn1cblxuXG5sZXQgeCA9IDxkaXY+e3RleHR9PC9kaXY+XG4iXSwibWFwcGluZ3MiOiJBQUNBO0FBRUEsYUFBYSxHQUFHLEdBQUcsVUFBVTtBQUN6QixNQUFJLE9BQU8sU0FBUyxjQUFjO0FBQ2xDLE1BQUksV0FBVyxTQUFTLGVBQWUsWUFBWSxFQUFFO0FBQ3JELE9BQUssWUFBWTtBQUNqQixXQUFTLEtBQUssWUFBWTtBQUFBO0FBSTlCLElBQUksSUFBSSxvQkFBQyxPQUFELE1BQU07IiwibmFtZXMiOltdfQ==