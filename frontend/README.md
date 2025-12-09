# Mancrel - Frontend

This directory contains the Next.js frontend for the Mancrel CRM application.

## How to Run

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    Make sure you have Node.js and npm (or yarn/pnpm) installed.
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

### Other Scripts

-   `npm run build`: Creates a production build of the application.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase for potential errors.

## Design Notes

-   **Styling:** The project uses [Tailwind CSS](https://tailwindcss.com/) for styling. Global styles can be found in `src/styles/globals.css`.
-   **Components:** Reusable components are located in the `src/components` directory.
-   **Sketches:** The initial UI mockups are represented by placeholder SVG sketches located in the `public/assets` directory. These are meant to be replaced with final design assets.

## Assets Attribution

The SVG files used in the initial design are simple placeholders created for layout purposes and do not require attribution.
- `hero-sketch.svg`
- `feature-1-sketch.svg`
- `feature-2-sketch.svg`
- `catalog-sketch.svg`
