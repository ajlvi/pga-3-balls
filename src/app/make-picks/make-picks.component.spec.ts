import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakePicksComponent } from './make-picks.component';

describe('MakePicksComponent', () => {
  let component: MakePicksComponent;
  let fixture: ComponentFixture<MakePicksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MakePicksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakePicksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
