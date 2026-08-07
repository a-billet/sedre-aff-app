'use client';

import { FeasibilityStudy, ProjectInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressMap } from '@/components/address-map';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectInfoFormProps {
  projectInfo: ProjectInfo;
  status: FeasibilityStudy['status'];
  onUpdate: (projectInfo: ProjectInfo) => void;
  onStatusChange: (status: FeasibilityStudy['status']) => void;
}

export function ProjectInfoForm({ projectInfo, status, onUpdate, onStatusChange }: ProjectInfoFormProps) {
  const handleChange = (field: keyof ProjectInfo, value: string | number) => {
    onUpdate({ ...projectInfo, [field]: value });
  };

  const statusLabel = {
    draft: 'Brouillon',
    in_progress: 'En cours',
    completed: 'Terminé',
  }[status];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Informations du projet
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="project-status" className="text-sm text-muted-foreground">
              Statut
            </Label>
            <Select value={status} onValueChange={(value) => onStatusChange(value as FeasibilityStudy['status'])}>
              <SelectTrigger id="project-status" className="w-45">
                <SelectValue placeholder="Sélectionner un statut">{statusLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="projectName">Nom du projet</Label>
            <Input
              id="projectName"
              value={projectInfo.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              placeholder="Ex: Résidence Les Jardins"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={projectInfo.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ex: 12 rue de la Paix"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={projectInfo.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Ex: Saint-Denis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Département</Label>
            <Input
              id="department"
              value={projectInfo.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="Ex: 974 - La Réunion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cadastralRef">Référence cadastrale</Label>
            <Input
              id="cadastralRef"
              value={projectInfo.cadastralRef}
              onChange={(e) => handleChange('cadastralRef', e.target.value)}
              placeholder="Ex: AB 123"
            />
          </div>
        </div>
        <AddressMap
          address={projectInfo.address}
          city={projectInfo.city}
          department={projectInfo.department}
        />
      </CardContent>
    </Card>
  );
}
