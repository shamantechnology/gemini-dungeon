// MapCanvas class
// Used for a canvas that will be used as a directional map to draw nodes and verticies on
class MapCanvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.circlePositions = []; // Store circle positions here
    }

    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    drawCircle(x, y) {
        const size = this.getCanvasSize();
        const scaledX = Math.floor(x * size.width);
        const scaledY = Math.floor(y * size.height);

        this.ctx.beginPath();
        this.ctx.arc(scaledX, scaledY, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();

        // Store the circle position
        this.circlePositions.push({ x, y });
    }

    updateCirclePositions() {
        const size = this.getCanvasSize();
        this.circlePositions.forEach(({ x, y }) => {
            const scaledX = Math.floor(x * size.width);
            const scaledY = Math.floor(y * size.height);
            this.drawCircle(scaledX, scaledY); // Redraw at updated position
        });
    }

    updateMapWithLine() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.circlePositions[0].x, this.circlePositions[0].y);

        for (let i = 1; i < this.circlePositions.length; i++) {
            const { x, y } = this.circlePositions[i];
            this.ctx.lineTo(x, y);
        }

        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();
    }

    saveCirclePositions() {
        localStorage.setItem('circlePositions', JSON.stringify(this.circlePositions));
    }
}
