export interface DhxEvent {
	/**
     * The event id, auto-generated if not set
    */
	id: string | number,
	/**
	 * The date when a event is scheduled to begin. 
	*/
	start_date?: Date | string,
	/**
	 * The date when a event is scheduled to be completed. 
	 * If this is a recurring event, this is the end date of the whole series.
	*/
	end_date?: Date | string,
	/**
	 * Displayed as the event text. Use text_template to customize the event text rendering.
	*/
	text?: string,
	/**
	 * Sets the background-color for the scheduler event element.
	*/
	color?: string,
	/**
	 * Sets css color (text color) for the event element.
	*/
	textColor?: string,
	/**
	 * The recurrence rule for the event.
	 * If set to null, the event is not a recurring event.
	*/
	rrule?: string | null,
	/**
	 * If true, the event is marked as deleted.
	 * If set to true, the event will not be displayed in the scheduler.
	 * Only works with modified instances of recurring events.
	*/
	deleted?: boolean | null,
	/**
	 * The id of the original event if this is a modified instance of recurring event.
	*/
	recurring_event_id?: string | number | null,
	/**
	 * The start date of the original occurrence of the series if this is a modified instance of recurring event.
	*/
	original_start?: Date | string | null,
	/**
	 * The duration of the event in seconds. Only used for recurring events.
	*/
	duration?: number | null,
	/**
	 * The recurrence type of the event (legacy).
	*/
	rec_type?: string | null,
	/**
	 * The id of the original event if this is a modified instance of recurring event (legacy).
	*/
	event_pid?: string | number | null,
	/**
	 * The length of the event in seconds if this a recurring series,
	 * or a timestamp of the original event if this is a modified occurrence of the series (legacy).
	*/
	event_length?: number | null,
	/**
     * additional users data
	*/
	[customProperty: string]: any;
}

export interface MappedCalendar {
  id: string;
  key: string;
  label: string;
  backgroundColor?: string;
}

export type SchedulerDataAction = "create" | "update" | "delete";

export type SchedulerDataProcessorPayload = DhxEvent & {
  calendarId?: string;
  timeZone?: string;
};