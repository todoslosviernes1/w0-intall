import { LitElement, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';

// import TouchDragListener from "./touch-listener";

type IProps = {
    name: string,
    description: string,
    icon: string
}

import template from './template-bottom-sheet';
import Utils from '../../../utils';

@customElement('pwa-bottom-sheet')
export default class PWABottomSheetElement extends LitElement {
	@property({type: Object}) props: IProps = {
        name: '',
        description: '',
        icon: ''
    };
    @property({type: Object}) install = {handleEvent: () => {}};
	@property() hideDialog = () => {};
	@property() disableClose = false;

	private _callInstall = () => {
		this.install.handleEvent();
	}

	private _callHide = () => {
		this.hideDialog();
		this.setupAppearence();
	}

	private bindedElement: {
		touchElement: HTMLElement,
		listener: any }| null = null;
	private readonly _saveBodyStyle = document.body.style.overscrollBehaviorY;
	private dragMobileSheet = (element: HTMLElement | null | undefined, touchTargetElement: HTMLElement | undefined, infoElement: HTMLElement | undefined) => {
		if (!element || !touchTargetElement || !infoElement)
			return null;

		let dragOffset = 0;
		const bounceOffset = 35;
		const bottomSize = touchTargetElement.clientHeight + infoElement.clientHeight;

		const getYCoord = (e: MouseEvent | TouchEvent): number => {
			return (e as MouseEvent).clientY || ((e as TouchEvent).changedTouches && (e as TouchEvent).changedTouches.length? (e as TouchEvent).changedTouches[0].clientY : 0);
		}

		const dragMouseDown = (e: MouseEvent | TouchEvent) => {
			window.addEventListener('mouseup', dragMouseUp);
			window.addEventListener('mousemove', dragMouseMove);
			window.addEventListener('touchend', dragMouseUp);
			window.addEventListener('touchmove', dragMouseMove);

			dragOffset = getYCoord(e) - touchTargetElement.getBoundingClientRect().top;

			document.body.style.overscrollBehaviorY = 'none';
		}
		const dragMouseUp = (e: MouseEvent | TouchEvent) => {
			document.body.style.overscrollBehaviorY = this._saveBodyStyle;

			if (!this.disableClose && getYCoord(e) >= window.innerHeight - 25) {
				closeDragElement(e, window.innerHeight + 50, true);
				return
			}

			if (window.innerHeight - getYCoord(e)  > element.clientHeight / 2.5) {
				closeDragElement(e, window.innerHeight - element.clientHeight);
				
				try {
					Utils.eventGallery((this.getRootNode() as ShadowRoot).host);
				} catch (e) {}
				return
			}
			else {
				closeDragElement(e, window.innerHeight - bottomSize - bounceOffset);
				return
			}
		}

		const dragMouseMove = (e: MouseEvent | TouchEvent) => {
			const currentY = getYCoord(e);

			if (this.disableClose && window.innerHeight - currentY < 70) {
				return
			}
			
			if (currentY <= (window.innerHeight - element.clientHeight + dragOffset)) {
				return
			}

			element.style.setProperty(
				"transition",
				`none`
			)

			element.style.setProperty(
				"--translateY",
				`translateY(${currentY - dragOffset}px)`
			);
		}

		const closeDragElement = (e: MouseEvent | TouchEvent, toPoint?: number, hideDialog?: boolean) => {
			window.removeEventListener('mouseup', dragMouseUp);
			window.removeEventListener('mousemove', dragMouseMove);
			window.removeEventListener('touchend', dragMouseUp);
			window.removeEventListener('touchmove', dragMouseMove);

			if (window.innerWidth >= 768)
				return

			if (!toPoint && getYCoord(e) >= window.innerHeight - bottomSize)
				element.style.setProperty(
					"--translateY",
					`translateY(calc(100vh - ${bottomSize}px))`
				);
			else
				element.style.setProperty(
					"--translateY",
					`translateY(${(toPoint || getYCoord(e)) + bounceOffset}px)`
				);

			element.style.setProperty(
				"transition",
				`transform 500ms cubic-bezier(0.4, 0, 0, 1) 0s`
			);

			if (hideDialog){
				touchTargetElement.removeEventListener('mousedown', dragMouseDown);
				touchTargetElement.removeEventListener('touchstart', dragMouseDown);

				setTimeout(
					this._callHide,
					250
				);
			}

		}

		touchTargetElement.addEventListener('mousedown', dragMouseDown);
		touchTargetElement.addEventListener('touchstart', dragMouseDown, {passive: true});

		closeDragElement(new MouseEvent('mouseup'), window.innerHeight - bottomSize - bounceOffset);

		return {
			touchElement: touchTargetElement,
			listener: dragMouseDown
		}
	}

	private setupAppearence = () => {
		if (this.bindedElement) {
			this.bindedElement.touchElement.removeEventListener('mousedown', this.bindedElement.listener);
			this.bindedElement.touchElement.removeEventListener('touchstart', this.bindedElement.listener);
		}

		this.bindedElement = this.dragMobileSheet(
			this.parentElement?.parentElement,
			this.parentElement?.getElementsByClassName('touch-header')[0] as HTMLElement,
			this.parentElement?.getElementsByClassName('body-header')[0] as HTMLElement);
	}
	private _init = () => {
		this.setupAppearence();

		window.addEventListener('resize', this.setupAppearence);

		return;
	}

	firstUpdated () {
		this._init();
        return;
	}

    createRenderRoot() {
        return this;
    }

	connectedCallback() {
		super.connectedCallback()

	}

	render() {
        return html`${template(this.props.name, this.props.description, this.props.icon, this._callInstall)}`;
	}
}
