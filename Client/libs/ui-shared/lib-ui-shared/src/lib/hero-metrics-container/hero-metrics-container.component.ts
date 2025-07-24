import { Component, Input, OnChanges } from '@angular/core';
import { DataService } from '@mango/core-shared';
import {
  Metric,
  Sidekick,
  ToastState,
} from '@mango/data-models/lib-data-models';
import { CremToastService } from '@mango/ui-shared/lib-ui-elements';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'crem-metric-container',
  templateUrl: './hero-metrics-container.component.html',
  styleUrls: ['./hero-metrics-container.component.scss'],
})
export class HeroMetricsContainerComponent implements OnChanges {
  private errorOccurred = false;

  @Input() schemaMetrics: any[];
  @Input() filterString: string;
  @Input() unitOfMeasureId?: number;
  @Input() exchangeRateId?: number;
  @Input() moduleId: number;

  constructor(
    private dataService: DataService,
    private toastService: CremToastService
  ) {}

  ngOnChanges(): void {
    this.schemaMetrics.forEach((metric) => {
      metric.dispMetric = false;
      if (metric.metricDetail) {
        delete metric.metricDetail;
      }
    });

    this.getAllMetricDetailsCombined();
  }

  getAllMetricDetails() {
    this.schemaMetrics.forEach((schemaMetric) => {
      this.getMetric(schemaMetric);
    });
  }

  getAllMetricDetailsCombined() {
    this.errorOccurred = false;

    if (this.moduleId == 1)
      return this.dataService
        .fetchAllPortfolioMetrics(
          this.schemaMetrics,
          this.unitOfMeasureId,
          this.filterString,
          this.exchangeRateId
        )
        .subscribe(
          (res: any) => {
            if (!res.success) {
              this.toastService.show(
                "We're currently unable to retrieve data. Please try again shortly.",
                'Error',
                ToastState.ERROR
              );

              this.errorOccurred = true;

              return null;
            } else {
              const metricDataList = res !== null ? res.data.data : null;

              this.schemaMetrics.forEach((schemaMetric) => {
                const metricData = metricDataList.find(
                  (md) =>
                    md.elementTypeName ===
                    schemaMetric.elementType.elementTypeName
                );
                if (
                  metricData !== undefined &&
                  metricData !== null &&
                  metricData !== ''
                ) {
                  schemaMetric.metricDetail = this.createMetricDetail(
                    schemaMetric,
                    metricData.data
                  );
                  schemaMetric.dispMetric = true;
                }
              });
            }
          },
          (error: any) =>
            console.log(
              `Error occurred getting ${
                this.moduleId == 1
                  ? 'Portfolio '
                  : this.moduleId == 2
                  ? 'Project '
                  : ''
              }Metrics: `,
              error
            ),
          () => {}
        );

    if (this.moduleId == 2)
      return this.dataService
        .fetchAllProjectMetrics(this.schemaMetrics, this.filterString)
        .subscribe(
          (res: any) => {
            if (!res.success) {
              this.toastService.show(
                "We're currently unable to retrieve data. Please try again shortly.",
                'Error',
                ToastState.ERROR
              );

              this.errorOccurred = true;

              return null;
            } else {
              const metricDataList = res !== null ? res.data.data : null;

              this.schemaMetrics.forEach((schemaMetric) => {
                const metricData = metricDataList.find(
                  (md) =>
                    md.elementTypeName ===
                    schemaMetric.elementType.elementTypeName
                );
                if (
                  metricData !== undefined &&
                  metricData !== null &&
                  metricData !== ''
                ) {
                  schemaMetric.metricDetail = this.createMetricDetail(
                    schemaMetric,
                    metricData.data
                  );
                  schemaMetric.dispMetric = true;
                }
              });
            }
          },
          (error: any) =>
            console.log(
              `Error occurred getting ${
                this.moduleId == 1
                  ? 'Portfolio '
                  : this.moduleId == 2
                  ? 'Project '
                  : ''
              }Metrics: `,
              error
            ),
          () => {}
        );
  }

  updateMetricInList(metric: any) {}

  private getMetric(schemaMetric: any) {
    const metricData: Observable<any> = schemaMetric.isActive
      ? this.getMetricData(schemaMetric)
      : of(null);

    metricData.subscribe(
      (res: any) => {
        const metricDetailData = res !== null ? res.data.data : null;

        schemaMetric.metricDetail = this.createMetricDetail(
          schemaMetric,
          metricDetailData
        );
        schemaMetric.dispMetric = schemaMetric.isActive;
      },
      (error: any) =>
        console.log(
          `Error occurred getting ${
            this.moduleId == 1
              ? 'Portfolio '
              : this.moduleId == 2
              ? 'Project '
              : ''
          }Metrics: `,
          error
        ),
      () => {}
    );
  }

  private getMetricData(schemaMetric: any): Observable<any> {
    if (this.moduleId == 1)
      return this.dataService.getPortfolioMetricDataByElementType(
        schemaMetric.elementType.elementTypeName,
        this.unitOfMeasureId,
        this.filterString,
        this.exchangeRateId
      );
    else if (this.moduleId == 2)
      return this.dataService.getProjectMetricDataByElementType(
        schemaMetric.elementType.elementTypeName,
        this.filterString
      );
  }

  private createMetricDetail(metric: any, data: any): Metric {
    let sidekickValue: Sidekick = null;

    //Set the values that do not depend on the data because the data could be null
    const metricDetail: Metric = {
      id: metric.elementType.elementTypeName,
      isActive: metric.isActive,
      elementId: metric.id,
      elementTypeId: metric.elementType.id,
    };

    if (data !== null) {
      if (data.sidekick !== null) {
        const [symbol, direction] = (
          data.sidekick || { valueIndicator: '' }
        ).valueIndicator.split('-');
        sidekickValue = {
          metricValue: data.sidekick.metricValue,
          symbol,
          direction,
        };
      }

      metricDetail.title = data.title;
      metricDetail.subtitle = data.subtitle;
      metricDetail.tooltipData = data.tooltipData;
      metricDetail.heroMetric = data.heroMetric;
      metricDetail.sidekick = sidekickValue;
    }

    return metricDetail;
  }
}
