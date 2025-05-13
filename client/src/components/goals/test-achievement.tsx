import React from 'react';
import { Button } from '@/components/ui/button';
import { useAchievements } from '@/hooks/use-achievements';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Schema for test achievement form
const testAchievementSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  type: z.string().min(1, { message: 'Achievement type is required' }),
  progress: z.boolean().optional(),
  progressCurrent: z.number().optional(),
  progressTarget: z.number().optional(),
  progressUnit: z.string().optional(),
});

type TestAchievementFormData = z.infer<typeof testAchievementSchema>;

export function TestAchievement() {
  const { createTestAchievement } = useAchievements();
  
  const form = useForm<TestAchievementFormData>({
    resolver: zodResolver(testAchievementSchema),
    defaultValues: {
      title: 'Test Achievement',
      description: 'This is a test achievement',
      type: 'milestone',
      progress: false,
      progressCurrent: 7,
      progressTarget: 10,
      progressUnit: 'km',
    },
  });
  
  const onSubmit = async (data: TestAchievementFormData) => {
    const achievementData: any = {
      title: data.title,
      description: data.description,
      type: data.type,
    };
    
    // Add progress data if enabled
    if (data.progress && data.progressCurrent && data.progressTarget) {
      achievementData.progress = {
        current: data.progressCurrent,
        target: data.progressTarget,
        unit: data.progressUnit || 'units',
      };
    }
    
    try {
      await createTestAchievement(achievementData);
    } catch (error) {
      console.error('Error creating test achievement:', error);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test Achievement Popup</CardTitle>
        <CardDescription>Create a test achievement to see how the popup looks</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Achievement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Achievement description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achievement Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select achievement type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                      <SelectItem value="personal_best">Personal Best</SelectItem>
                      <SelectItem value="race">Race</SelectItem>
                      <SelectItem value="challenge">Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Include Progress Bar</FormLabel>
                    <FormDescription>
                      Show a progress bar in the achievement popup
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch('progress') && (
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="progressCurrent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="progressTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="progressUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="km, days, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <Button type="submit" className="w-full">
              Create Achievement
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}