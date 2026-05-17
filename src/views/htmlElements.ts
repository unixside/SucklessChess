export function createDiv(
    cls: string,
    id: string,
    width: number,
    height: number,
): HTMLDivElement {
    const div = document.createElement('div');
    div.setAttribute('class', cls);
    div.setAttribute('id', id);
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    return div;
}

export function createImage(
    src: string,
    id: string,
    className: string,
): HTMLImageElement {
    const image = new Image();
    image.id = id;
    image.src = src;
    image.className = className;
    image.className = 'piece';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    image.draggable = true;
    return image;
}
