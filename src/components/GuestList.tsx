import { useState, useMemo } from "react";
import { Guest, ConfirmationStatus, Accommodation, GuestGroup } from "@/types/guest";
import { GuestCard } from "./GuestCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface GuestListProps {
  guests: Guest[];
  onToggleArrived?: (id: string, arrived: boolean) => void;
  eventTitle?: string;
}

const accommodations: Accommodation[] = [
  "Sandi",
  "Aconchego",
  "Vila Bom jardim",
  "Bartholomeu",
  "Barco próprio",
  "Pousada Literária",
];

const statuses: ConfirmationStatus[] = ["Confirmado", "Pendente", "Não comparecerá"];
const groups: GuestGroup[] = ["Família", "Amigos"];

export function GuestList({ guests, onToggleArrived, eventTitle }: GuestListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accommodationFilter, setAccommodationFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [arrivedFilter, setArrivedFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const matchesSearch =
        guest.name.toLowerCase().includes(search.toLowerCase()) ||
        guest.inviteName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || guest.status === statusFilter;
      const matchesAccommodation =
        accommodationFilter === "all" || guest.accommodation === accommodationFilter;
      const matchesGroup = groupFilter === "all" || guest.group === groupFilter;
      const matchesArrived =
        arrivedFilter === "all" || (arrivedFilter === "yes" ? !!guest.arrived : !guest.arrived);
      return matchesSearch && matchesStatus && matchesAccommodation && matchesGroup && matchesArrived;
    });
  }, [guests, search, statusFilter, accommodationFilter, groupFilter, arrivedFilter]);

  const activeFilters = [statusFilter, accommodationFilter, groupFilter, arrivedFilter].filter(
    (f) => f !== "all"
  ).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setAccommodationFilter("all");
    setGroupFilter("all");
    setArrivedFilter("all");
  };

  

  const handleExportPDF = async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const margin = 36; // 0.5in
    const lineHeight = 16;
    const titleSize = 18;
    const textSize = 10;
    const pageWidth = 595.28; // A4 width pt
    const pageHeight = 841.89; // A4 height pt

    const addPage = () => doc.addPage([pageWidth, pageHeight]);
    let page = addPage();
    let y = pageHeight - margin;

    const drawText = (text: string, x: number, size = textSize) => {
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
    };

    const drawHeader = () => {
      const t = eventTitle || (localStorage.getItem("isola.title") || "Evento");
      const date = new Date().toLocaleDateString("pt-BR");
      drawText(String(t), margin, titleSize);
      y -= titleSize + 6;
      drawText(`Data: ${date}`, margin);
      y -= lineHeight;
      const filters: string[] = [];
      if (statusFilter !== "all") filters.push(`Status: ${statusFilter}`);
      if (accommodationFilter !== "all") filters.push(`Hospedagem: ${accommodationFilter}`);
      if (groupFilter !== "all") filters.push(`Grupo: ${groupFilter}`);
      if (arrivedFilter !== "all") filters.push(`Chegada: ${arrivedFilter === "yes" ? "Chegou" : "Não chegou"}`);
      drawText(filters.length ? `Filtros: ${filters.join("; ")}` : "Sem filtros", margin);
      y -= lineHeight;
      drawText(`Convidados (${filteredGuests.length})`, margin);
      y -= lineHeight;
      // table header
      drawText("Nome", margin);
      drawText("Convite", margin + 160);
      drawText("Grupo", margin + 280);
      drawText("Hospedagem", margin + 340);
      drawText("Status", margin + 440);
      drawText("Chegada", margin + 510);
      y -= lineHeight;
      page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
      y -= 6;
    };

    const ensureSpace = () => {
      if (y < margin + 2 * lineHeight) {
        page = addPage();
        y = pageHeight - margin;
        drawHeader();
      }
    };

    drawHeader();
    for (const g of filteredGuests) {
      ensureSpace();
      drawText(g.name, margin);
      drawText(g.inviteName, margin + 160);
      drawText(g.group, margin + 280);
      drawText(g.accommodation || "", margin + 340);
      drawText(g.status, margin + 440);
      drawText(g.arrived ? "Sim" : "Não", margin + 510);
      y -= lineHeight;
    }

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `convidados-${date}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar convidado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Button onClick={handleExportPDF} variant="outline" className="flex gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
            <SheetHeader>
              <SheetTitle className="font-display">Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hospedagem</label>
                <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {accommodations.map((acc) => (
                      <SelectItem key={acc} value={acc}>
                        {acc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grupo</label>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chegada</label>
                <Select value={arrivedFilter} onValueChange={setArrivedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Chegou</SelectItem>
                    <SelectItem value="no">Não chegou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFilters > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredGuests.length} convidado{filteredGuests.length !== 1 && "s"}
      </div>

      <div className="grid gap-3 pb-20">
        {filteredGuests.map((guest) => (
          <GuestCard key={guest.id} guest={guest} onArrivedToggle={onToggleArrived} />
        ))}
        {filteredGuests.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum convidado encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
