import { Card, CardContent } from '@/components/ui/card';

/**
 * Stub screen for module owners to replace. Each member builds their real page
 * in place of this. See docs/prompts/*.md for the exact spec.
 */
export function Placeholder({ title, owner, brief }: { title: string; owner: string; brief: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">{title}</h1>
      <Card>
        <CardContent className="space-y-2 p-6">
          <p className="text-sm">
            <span className="font-normal">Owner:</span> {owner}
          </p>
          <p className="text-sm text-muted-foreground">{brief}</p>
          <p className="text-xs text-muted-foreground">
            This is a scaffolded placeholder. The API route is already wired and RBAC-guarded —
            build the real screen here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
