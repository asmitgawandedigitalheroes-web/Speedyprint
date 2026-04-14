import { redirect } from 'next/navigation'

// The canonical MTB Boards page lives at /mtb-boards.
// This route exists to handle direct links and references to /products/mtb-boards.
export default function MtbBoardsRedirect() {
  redirect('/mtb-boards')
}
