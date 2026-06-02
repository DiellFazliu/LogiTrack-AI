// src/components/common/__tests__/DataTable.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';

interface TestData {
  id: string;
  name: string;
  status: string;
}

describe('DataTable', () => {
  const mockColumns = [
    { key: 'id' as const, header: 'ID' },
    { key: 'name' as const, header: 'Name' },
    { key: 'status' as const, header: 'Status' },
  ];

  const mockData: TestData[] = [
    { id: '1', name: 'John Doe', status: 'Active' },
    { id: '2', name: 'Jane Smith', status: 'Inactive' },
  ];

  it('should render table with correct headers', () => {
    render(<DataTable<TestData> columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should render table with correct data', () => {
    render(<DataTable<TestData> columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<DataTable<TestData> columns={mockColumns} data={[]} isLoading={true} />);
    
    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<DataTable<TestData> columns={mockColumns} data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should call onRowClick when row is clicked', async () => {
    const handleRowClick = vi.fn();
    render(
      <DataTable<TestData> 
        columns={mockColumns} 
        data={mockData} 
        onRowClick={handleRowClick} 
      />
    );
    
    const row = screen.getByText('John Doe').closest('tr');
    if (row) {
      fireEvent.click(row);
    }
    
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should call onEdit when edit button is clicked', async () => {
    const handleEdit = vi.fn();
    render(
      <DataTable<TestData> 
        columns={mockColumns} 
        data={mockData} 
        onEdit={handleEdit} 
      />
    );
    
    const editButtons = screen.getAllByText('Edit');
    await userEvent.click(editButtons[0]);
    
    expect(handleEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const handleDelete = vi.fn();
    render(
      <DataTable<TestData> 
        columns={mockColumns} 
        data={mockData} 
        onDelete={handleDelete} 
      />
    );
    
    const deleteButtons = screen.getAllByText('Delete');
    await userEvent.click(deleteButtons[0]);
    
    expect(handleDelete).toHaveBeenCalledWith(mockData[0]);
  });
});